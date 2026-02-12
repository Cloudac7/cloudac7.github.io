---
date: 2026-02-12
updated: 2026-02-12
remote_path: source/_posts/notebooks/simulation
notebook: molecular_simulation
tags:
  - MD
  - DeePMD
  - Lammps
---
## 安装

```Bash
module load deepmd/2.2.7
export deepmd_root=/path/to/plugin # define as you like

git clone https://github.com/deepmodeling/deepmd-kit.git -b devel
cd deepmd-kit/source
mkdir build
cd build
export DP_VIRIANT=cuda
export CC=`which gcc`
export CXX=`which g++`
cmake -DLAMMPS_SOURCE_ROOT=/data/share/apps/lammps/23Jun2022_update4_gpu/source_code -DUSE_TF_PYTHON_LIBS=TRUE -DUSE_CUDA_TOOLKIT=TRUE -DCMAKE_INSTALL_PREFIX=$deepmd_root ..
make -j 8
make install
```

## 使用

- 提交脚本
    
    ```Bash
    #!/bin/bash
    \#SBATCH -N 1
    \#SBATCH --ntasks-per-node=4
    \#SBATCH -t 96:00:00
    \#SBATCH --partition=gpu2
    \#SBATCH --gres=gpu:a100:1
    #\#SBATCH --gres=gpu:1
    
    # add modulefiles
    module add deepmd/2.2.7
    
    # /path/to/plugin same to above
    export LD_LIBRARY_PATH=/path/to/plugin/lib:$LD_LIBRARY_PATH
    export LAMMPS_PLUGIN_PATH=/path/to/plugin/lib/deepmd_lmp
    
    export OMP_NUM_THREADS=1
    export TF_INTRA_OP_PARALLELISM_THREADS=1
    export TF_INTER_OP_PARALLELISM_THREADS=1
    
    lmp_mpi -in input.lammps
    ```