from pathlib import Path
import subprocess
import sys


ROOT = Path(__file__).resolve().parent


def main() -> None:
    command = [
        sys.executable,
        "-m",
        "PyInstaller",
        "--clean",
        "--noconfirm",
        "--onefile",
        "--name",
        "decision-support-backend",
        "--distpath",
        str(ROOT / "dist"),
        "--workpath",
        str(ROOT / "build"),
        "--specpath",
        str(ROOT / "build"),
        "--hidden-import=app",
        "--hidden-import=app.controllers",
        "--hidden-import=app.helpers",
        "--hidden-import=numpy",
        "--hidden-import=sklearn",
        "app/cli.py",
    ]

    subprocess.run(command, cwd=ROOT, check=True)


if __name__ == "__main__":
    main()