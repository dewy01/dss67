from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Union
from app.helpers.classification_engine import ClassificationEngine

router = APIRouter(prefix="/classification", tags=["classification"])


class MethodConfig(BaseModel):
    method: str
    params: Dict[str, Any]


class QualityAssessmentRequest(BaseModel):
    datasetId: str
    classColumnIndex: int
    methods: List[MethodConfig]


class ClassificationRequest(BaseModel):
    datasetId: str
    classColumnIndex: int
    newObject: List[Union[str, float, int]]
    methods: List[MethodConfig]


class QualityResult(BaseModel):
    method: str
    accuracy: float
    correctCount: int
    totalCount: int


class MethodResult(BaseModel):
    method: str
    predictedClass: str
    confidence: float


class ClassificationResponse(BaseModel):
    methodResults: List[MethodResult]
    votedClass: str
    voteDistribution: Dict[str, int]


@router.post("/assess-quality", response_model=List[QualityResult])
async def assess_quality(request: QualityAssessmentRequest):
    """
    Assess classification quality using leave-one-out cross-validation.
    """
    try:
        engine = ClassificationEngine(request.datasetId, request.classColumnIndex)
        results = []

        for method_config in request.methods:
            accuracy, correct_count, total_count = engine.assess_quality(
                method_config.method, method_config.params
            )
            
            results.append(
                QualityResult(
                    method=method_config.method,
                    accuracy=accuracy,
                    correctCount=correct_count,
                    totalCount=total_count,
                )
            )

        return results

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/classify", response_model=ClassificationResponse)
async def classify_object(request: ClassificationRequest):
    """
    Classify a new object using configured methods and voting.
    """
    try:
        engine = ClassificationEngine(request.datasetId, request.classColumnIndex)
        method_results = []
        votes: Dict[str, int] = {}

        for method_config in request.methods:
            predicted_class, confidence = engine.classify(
                request.newObject, method_config.method, method_config.params
            )
            
            method_results.append(
                MethodResult(
                    method=method_config.method,
                    predictedClass=predicted_class,
                    confidence=confidence,
                )
            )
            
            votes[predicted_class] = votes.get(predicted_class, 0) + 1

        voted_class = max(votes, key=votes.get) if votes else None

        return ClassificationResponse(
            methodResults=method_results,
            votedClass=voted_class,
            voteDistribution=votes,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
