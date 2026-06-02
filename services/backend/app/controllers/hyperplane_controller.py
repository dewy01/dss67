from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from app.helpers.hyperplane_classifier import HyperplaneClassifier

router = APIRouter(prefix="/hyperplane", tags=["hyperplane"])


class HyperplaneRequest(BaseModel):
    datasetId: str
    classColumnIndex: int
    maxIterations: int = 100
    minSeparation: float = 0.1


class HyperplaneResponse(BaseModel):
    transformedData: List[List[Any]]
    hyperplanes: List[Dict[str, Any]]
    binaryMapping: Dict[str, str]
    regionClasses: Dict[str, str]
    linearSeparability: Dict[str, Any]
    nHyperplanes: int
    totalCuts: int
    totalSeparatedPoints: int
    axisStatistics: List[Dict[str, Any]]
    cutHistory: List[Dict[str, Any]]


@router.post("/classify", response_model=HyperplaneResponse)
async def classify_with_hyperplanes(request: HyperplaneRequest):
    """
    Partition space using axis-aligned hyperplanes and transform dataset to binary vector space.
    """
    try:
        classifier = HyperplaneClassifier(request.datasetId, request.classColumnIndex)
        result = classifier.classify(
            max_iterations=request.maxIterations,
            min_separation=request.minSeparation,
        )

        # Convert binary mapping keys from int to string for JSON
        binary_mapping_str = {
            str(k): "".join(map(str, v)) if v else "0"
            for k, v in result["binary_mapping"].items()
        }

        region_classes_str = {
            "".join(map(str, k)) if k else "0": v
            for k, v in result["region_classes"].items()
        }

        return HyperplaneResponse(
            transformedData=result["transformed_data"],
            hyperplanes=result["hyperplanes"],
            binaryMapping=binary_mapping_str,
            regionClasses=region_classes_str,
            linearSeparability=result["linear_separability"],
            nHyperplanes=result["n_hyperplanes"],
            totalCuts=result["total_cuts"],
            totalSeparatedPoints=result["total_separated_points"],
            axisStatistics=result["axis_statistics"],
            cutHistory=result["cut_history"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/download-csv")
async def download_transformed_data(request: HyperplaneRequest):
    """
    Generate CSV file with transformed (binary vector) dataset.
    """
    try:
        classifier = HyperplaneClassifier(request.datasetId, request.classColumnIndex)
        classifier.classify(
            max_iterations=request.maxIterations,
            min_separation=request.minSeparation,
        )
        csv_data = classifier.get_transformed_csv_data()

        return {
            "csv_data": csv_data,
            "filename": f"transformed_data_{request.datasetId}.csv",
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
