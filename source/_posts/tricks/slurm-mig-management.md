---
title: "利用Slurm管理NVIDIA MIG实例"
author: 
  name: Cloudac7
date: 2024-07-05
updated: 2024-07-05
categories:
  - Tricks
  - HPC Management
---

可能有人看到这个标题便会有疑问，照理说 Slurm 21.08 以上已经提供了 MIG 支持，只要按照[官方文档](https://slurm.schedmd.com/gres.html#MIG_Management)上的指引便可以正确运行。

但情况并没有这么简单，因为官方文档中提到的 `AutoDetect=nvml` 特性实际上需要在配置/编译 Slurm 时确保 `--with-nvml` 特性开启，且需要正确安装 NVML 库来支持。
由于 Slurm 通常是集群建设时由厂商工程师部署，往往并没有编译这一特性支持。于是要想开启这一功能，我们需要对 Slurm 进行重新编译或寻找满足要求的二进制包……

作为一个简单的 Work Around，本文自然未打算对这个情况进行说明。因此我们退而求其次，选择并非基于 `AutoDetect=nvml` 的方案，即手动配置。

若要人工配置 MIG 硬件，我们需要在 Slurm 的 `gres.conf` 中写入 MIG 对应的硬件挂载路径。根据官方文档，每一个 MIG 实例都挂载为一个 `/dev/nvidia-caps/nvidia-cap*` 设备，则通过指定这些路径便可以正确配置硬件信息。

这里我们先事先创建好 MIG 实例，例如在开启了 MIG 特性支持的 2 和 3 号 GPU 上通过运行：

```
sudo nvidia-smi mig -i 2,3 -cgi 19,19,19,19,19,19,19 -C
```

便可以创建 14 个显存大小约 10G 的 GPU 计算实例，通过 `nvidia-smi` 可以看到：

```
+---------------------------------------------------------------------------------------+
| NVIDIA-SMI 535.129.03             Driver Version: 535.129.03   CUDA Version: 12.2     |
|-----------------------------------------+----------------------+----------------------+
| GPU  Name                 Persistence-M | Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp   Perf          Pwr:Usage/Cap |         Memory-Usage | GPU-Util  Compute M. |
|                                         |                      |               MIG M. |
|=========================================+======================+======================|
|   0  NVIDIA A100 80GB PCIe          Off | 00000000:17:00.0 Off |                    0 |
| N/A   46C    P0              63W / 300W |      4MiB / 81920MiB |      0%      Default |
|                                         |                      |             Disabled |
+-----------------------------------------+----------------------+----------------------+
|   1  NVIDIA A100 80GB PCIe          Off | 00000000:65:00.0 Off |                    0 |
| N/A   50C    P0              76W / 300W |      4MiB / 81920MiB |      0%      Default |
|                                         |                      |             Disabled |
+-----------------------------------------+----------------------+----------------------+
|   2  NVIDIA A100 80GB PCIe          Off | 00000000:CA:00.0 Off |                   On |
| N/A   46C    P0              64W / 300W |     87MiB / 81920MiB |     N/A      Default |
|                                         |                      |              Enabled |
+-----------------------------------------+----------------------+----------------------+
|   3  NVIDIA A100 80GB PCIe          Off | 00000000:E3:00.0 Off |                   On |
| N/A   49C    P0              73W / 300W |     87MiB / 81920MiB |     N/A      Default |
|                                         |                      |              Enabled |
+-----------------------------------------+----------------------+----------------------+

+---------------------------------------------------------------------------------------+
| MIG devices:                                                                          |
+------------------+--------------------------------+-----------+-----------------------+
| GPU  GI  CI  MIG |                   Memory-Usage |        Vol|      Shared           |
|      ID  ID  Dev |                     BAR1-Usage | SM     Unc| CE ENC DEC OFA JPG    |
|                  |                                |        ECC|                       |
|==================+================================+===========+=======================|
|  2    7   0   0  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  2    8   0   1  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  2    9   0   2  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  2   10   0   3  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  2   11   0   4  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  2   12   0   5  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  2   13   0   6  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3    7   0   0  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3    8   0   1  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3    9   0   2  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3   11   0   3  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3   12   0   4  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3   13   0   5  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
|  3   14   0   6  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+

+---------------------------------------------------------------------------------------+
| Processes:                                                                            |
|  GPU   GI   CI        PID   Type   Process name                            GPU Memory |
|        ID   ID                                                             Usage      |
|=======================================================================================|
|  No running processes found                                                           |
+---------------------------------------------------------------------------------------+
```

但若使用 `ls -1 /dev/nvidia-caps/nvidia-cap*` 去查询挂载路径，就会发现下面给出的项目可能会远远多于我们实际创建的 MIG 实例数量。

```
/dev/nvidia-caps/nvidia-cap1
/dev/nvidia-caps/nvidia-cap2
/dev/nvidia-caps/nvidia-cap336
/dev/nvidia-caps/nvidia-cap337
/dev/nvidia-caps/nvidia-cap345
/dev/nvidia-caps/nvidia-cap346
/dev/nvidia-caps/nvidia-cap354
/dev/nvidia-caps/nvidia-cap355
/dev/nvidia-caps/nvidia-cap363
/dev/nvidia-caps/nvidia-cap364
/dev/nvidia-caps/nvidia-cap372
/dev/nvidia-caps/nvidia-cap373
/dev/nvidia-caps/nvidia-cap381
/dev/nvidia-caps/nvidia-cap382
/dev/nvidia-caps/nvidia-cap390
/dev/nvidia-caps/nvidia-cap391
/dev/nvidia-caps/nvidia-cap471
/dev/nvidia-caps/nvidia-cap472
/dev/nvidia-caps/nvidia-cap480
/dev/nvidia-caps/nvidia-cap481
/dev/nvidia-caps/nvidia-cap489
/dev/nvidia-caps/nvidia-cap490
/dev/nvidia-caps/nvidia-cap507
/dev/nvidia-caps/nvidia-cap508
/dev/nvidia-caps/nvidia-cap516
/dev/nvidia-caps/nvidia-cap517
/dev/nvidia-caps/nvidia-cap525
/dev/nvidia-caps/nvidia-cap526
/dev/nvidia-caps/nvidia-cap534
/dev/nvidia-caps/nvidia-cap535
```

实际上上面的路径数量足足有 32 个，显然我们只有 14 个 GPU 实例。于是陷入僵局，到底哪些路径是可用的呢？

这里我们参考了[这篇博客](https://medium.com/nttlabs/nvidia-a100-mig-as-linux-device-66220ca16698)的思路，从中找到真正发挥作用的设备。

文中提到，通过开启 A100 的 DEVFS 模式，便可以通过 `/dev` 来指定对应的 MIG 实例。当然由于我们的驱动远远高于 450 版本，故已经默认开启了 DEVFS 模式。
此时，若运行以下命令，我们便令 `migconfig` 和 `migmonitor` 生效。

```
nvidia-modprobe \
    -f /proc/driver/nvidia/capabilities/mig/config \
    -f /proc/driver/nvidia/capabilities/mig/monitor 
```

这样，当创建实例时，我们便可以从 `/proc/driver/nvidia-caps/mig-minors` 中得到创建的 MIG 实例所对应的的设备编号，查询的方式便是 `gpu<gpu id>/gi<gpu instance id>/ci<compute instance id>`。

例如对上面的 `nvidia-smi` 输出中的第一个设备：

```
+---------------------------------------------------------------------------------------+
| MIG devices:                                                                          |
+------------------+--------------------------------+-----------+-----------------------+
| GPU  GI  CI  MIG |                   Memory-Usage |        Vol|      Shared           |
|      ID  ID  Dev |                     BAR1-Usage | SM     Unc| CE ENC DEC OFA JPG    |
|                  |                                |        ECC|                       |
|==================+================================+===========+=======================|
|  2    7   0   0  |              12MiB /  9728MiB  | 14      0 |  1   0    0    0    0 |
|                  |               0MiB / 16383MiB  |           |                       |
+------------------+--------------------------------+-----------+-----------------------+
```

即在 GPU2 上创建的 7 号实例对应的编号 (GPU:2, GI: 7, CI: 0)，即可：

```bash
cat /proc/driver/nvidia-caps/mig-minors | grep "gpu2/gi7/ci0"
gpu2/gi7/ci0 337
```

即 `/dev/nvidia-caps/nvidia-cap/nvidia-cap337`。

通过类似的操作我们便可以得到每个 MIG 实例所对应的挂载路径，从而可以在 `gres.conf` 中写入类似于以下的行：

```
# 未开启 MIG 的
NodeName=c51-g002 Name=gpu Type=a100 File=/dev/nvidia[0,1]
NodeName=c51-g002 Name=gpu Type=1g.10gb File=/dev/nvidia-caps/nvidia-cap[337,346,355,364,373,382,391,472,481,490,508,517,526,535]
```

然后我们便可将这些设备配置到所需的队列中并用 `--gres` 来进行指定，例如在 `slurm.conf` 中：

```
# node, gres
GresTypes=gpu
NodeName=c51-g002 CPUs=64 Sockets=2 CoresPerSocket=16 ThreadsPerCore=2 RealMemory=515275 Gres=gpu:a100:2,gpu:1g.10gb:14

# gpu
PartitionName=gpu2 MaxTime=INFINITE Nodes=c51-g002 State=UP
```

当然如果想要用一行命令直接得到Node配置，可以参考以下的写法：

```bash
# 获取 MIG 设备的 cap 编号
get_cap_numbers() {
    sudo nvidia-smi mig -lci | awk '
    /^[|][ ]+[0-9]/ {
        gsub(/^[|]/, "");
        gsub(/[ ]+/, " ");
        split($0, a, " ");
        printf "gpu%s/gi%s/ci%s\n", a[1], a[2], a[5]
    }' | while read mig_instance; do
        grep "$mig_instance" /proc/driver/nvidia-caps/mig-minors | awk '{print $NF}'
    done | sort -n | uniq | paste -sd,
}

# 打印新的 GPU 配置
echo "NodeName=c51-g002 Name=gpu Type=1g.10gb File=/dev/nvidia-caps/nvidia-cap[$(get_cap_numbers)]"
```