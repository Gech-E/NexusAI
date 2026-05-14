import os
import subprocess
import sys

def run_command(command, cwd=None):
    print(f"Running: {' '.join(command)} in {cwd or os.getcwd()}")
    result = subprocess.run(command, cwd=cwd, text=True)
    if result.returncode != 0:
        print(f"Error executing {' '.join(command)}")
        sys.exit(result.returncode)

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    frontend_dir = os.path.join(root_dir, "frontend")
    backend_dir = os.path.join(root_dir, "backend")

    print("--- Nexus LearnAI Setup ---")
    
    # 1. Setup Backend
    print("\n[1/3] Setting up Backend...")
    venv_dir = os.path.join(backend_dir, ".venv")
    if not os.path.exists(venv_dir):
        run_command([sys.executable, "-m", "venv", ".venv"], cwd=backend_dir)
    
    # Provide instructions for activating since we can't cleanly do it in python cross-platform
    pip_exe = os.path.join(venv_dir, "Scripts", "pip") if os.name == "nt" else os.path.join(venv_dir, "bin", "pip")
    run_command([pip_exe, "install", "-r", "requirements.txt"], cwd=backend_dir)

    # 2. Setup Frontend
    print("\n[2/3] Setting up Frontend...")
    if os.name == "nt":
        run_command(["npm.cmd", "install"], cwd=frontend_dir)
    else:
        run_command(["npm", "install"], cwd=frontend_dir)

    print("\n[3/3] Done! Ensure Docker is running to use docker-compose.")

if __name__ == "__main__":
    main()
