---
title: "新时代的快乐科研：WSL2+Docker+EasyConnect+Clash"
author: 
  name: Cloudac7
date: 2022-03-23
updated: 2022-03-23
image: docker.jpg
categories:
  - Tricks
  - Containerize Your Life
banner: /images/docker.jpg
---

> 容器化拯救世界。——沃兹基硕德
> 
> 本文是 Containerize Your Life 系列的第1篇博文。
>
> 这一系列旨在用容器化整合、加速环境部署，让读者快速聚焦于生产力，也是一些零散心得的整理。

新冠疫情之下，封校+实验室关闭，没有办法，只能在宿舍<del>愉快摸鱼</del>工作。由于宿舍的网是电信光纤，而非狭义的校园网，故连接到课题组集群尚需要使用EasyConnect VPN。众所周知，EasyConnect是一款流氓软件，并且WSL2的流量无法通过前者代理，因而需要另寻道路。

## 开端：WSL2+Docker

本文WSL运行环境：WSL2+Debian（为什么不是Ubuntu呢，我也想知道www）

众所周知，微软在Windows 10发布之初，便画了Windows Subsystem for Linux这个大饼，最终在2017年算是把饼端了上来。初代WSL实现了NT内核到Linux内核指令集的互转，但缺乏对更底层特性的支持，包括Docker和CUDA都无法运行，堪称官方版Cygwin。之所以想要升级到WSL2，正是因为其提供了对Docker和CUDA的完整支持。在Windows 11加持下，更是可以通过[WSLg](https://docs.microsoft.com/en-us/windows/wsl/tutorials/gui-apps)直接使用图形界面（且完整支持X11，妈妈再也不用担心我的`$DISPLAY`配置写不对了）。从而在Windows 11下，可以获得接近原生Linux的完整体验（不愧是连长相都像macOS的一代）。

如果你仍在使用WSL1，也可以升级到WSL2。如果你的工作更多依赖本地磁盘文件而不需要更底层的应用，也可以停留在WSL1，后者对Windows分区文件读取性能更好。

而前文提到，WSL2的流量无法通过EasyConnect代理。一个简单的解决方案因而浮现出来，使用EasyConnect的Docker镜像来解决问题。

目前，[@Hagb](https://github.com/Hagb)大佬已经提供了基于EasyConnect Linux客户端封装的[Docker镜像](https://github.com/Hagb/docker-easyconnect)。以下仅作简单说明，详细使用方法请参考上述链接。

首先安装Docker，基本上是一键完成，因而也没有太多注意事项。安装好后记得检查下设置，确保开启了对WSL2的支持。

![image-20220323114600926](https://s2.loli.net/2022/03/23/Ma7KlZNIGHmX3Y5.png)

一切就绪后我们就可以开始Docker人生了。首先创建配置文件：

```bash
touch ~/.easyconn
```

加载容器：

```bash
docker run -d --device /dev/net/tun --cap-add NET_ADMIN -ti -p 127.0.0.1:1080:1080 -p 127.0.0.1:8888:8888 -e EC_VER=7.6.3 -v $HOME/.easyconn:/root/.easyconn -e CLI_OPTS="-d <vpn_address> -u <username> -p <password>" hagb/docker-easyconnect:cli
```

注意替换`<vpn_address>`，`<username>`，`<password>`为自己学校/单位的SSLVPN地址、用户名和密码。

可以在Docker Desktop中点击创建出的容器，查看一下日志（主要是检查下有没有登陆成功）。可能在几次（次数取决于运气，可能0-2）登陆失败后，终于在最下行出现了：

```
user "<username>" login successfully
```

说明登陆成功，可以继续愉快玩耍了。

上述命令中我们映射了两组端口，分别是1080和8888，对应`socks`和`http`代理。接下来我们便尝试利用Socks隧道对SSH进行代理。Debian下的`nc`命令似乎并不支持`-x`选项，因而在百度上直接搜到的教程可能并不能奏效。因此，这里采用其他方案。

```bash
sudo apt update
sudo apt install connect-proxy
```

然后配置`~/.ssh/config`，采用如下格式：

```
Host <cluster>
    User <cluster_username>
    Hostname <cluster_ip>
    Port <cluster_port>
    ProxyCommand connect-proxy -S localhost:1080 %h %p
```

请务必替换上文中信息为自己的用户名、IP、端口等。当然Hostname可以随便取。

然后测试一下是否可以正常连接：

```bash
ssh <cluster>
```

如果看到了登陆成功信息，说明你的EasyConnect已经正确配置在WSL上。

## 进阶：Clash配置Socks定向转发

但上述方法仅适用于WSL2内部的SSH，如果需要在Windows本体使用SSH（比如VSCode的Remote，舒爽程度可谓谁用谁知道），尚且需要想办法通过Socks进行代理。同时，作为一个合格的科研人，科学的上网工具自然是必备，后者可以帮助我们合理使用404搜索引擎快速检索所需的文献。但科学上网工具很多也同样基于Socks5代理，甚至可能存在端口冲突（不少客户端默认使用1080端口）。

Clash作为功能强大的多平台代理客户端，可以方便地解决Socks代理问题。

首先安装Clash客户端（如果有的话跳过此步）。

运行，点击`config.yaml`右侧的`<>`，进入规则编辑。

![image-20220323121155764](https://s2.loli.net/2022/03/23/45q3OJh8UCft1yG.png)

在配置文件中，添加以下代理组（放置在`proxies`下）：

```yaml
proxies:
  - name: "vpn1"
    type: socks5
    server: 127.0.0.1
    port: 1080
```

这里的端口是我们上文映射的1080端口。Clash默认采用7890端口，故其他代理不会与之冲突。

然后在规则组中添加以下条目：

```yaml
rules:
  - IP-CIDR,xxx.xxx.xxx.0/24,vpn1
  - IP-CIDR,xxx.xxx.xxx.xxx/32,vpn1
```

这里的写法请参考[CIDR转换表]([CIDR Conversion Table | HPE Edgeline Docs](https://techlibrary.hpe.com/docs/otlink-wo/CIDR-Conversion-Table.html))。第一行表示`xxx.xxx.xxx.1`直到`xxx.xxx.xxx.254`的所有IP，第二行则表示只包括`xxx.xxx.xxx.xxx`这一个IP地址。注意这里的`vpn1`对应`proxies`中的`name`字段。

保存，如果没有报错说明正确。然后检查需要校园网权限的网站，若可以访问，说明配置成功。

但聪明的你可能已经发现，PowerShell下的SSH还是没走代理啊？

是的，我们还需要额外一步：开启TUN模式。这样CFW可以接管非系统代理应用的流量。

详细步骤请参考[官方文档](https://docs.cfw.lbyczf.com/contents/tun.html)，对0.19.0以上版本，只需进行以下两步：

> 1. 点击`General`中`Service Mode`右边`Manage`，在打开窗口中安装服务模式，安装完成应用会自动重启，Service Mode 右边地球图标变为`绿色`即安装成功（无法安装参考：[这里](https://docs.cfw.lbyczf.com/contents/questions.html#service-mode-无法安装-windows)）
> 2. 点击`General`中`TUN Mode`右边开关启动 TUN 模式

接下来就是见证奇迹的时刻。打开PowerShell，直接输入ssh命令登陆校园网集群，便可以登陆成功，且在Clash的Connecting选项卡可以看到对应的连接。打开VSCode，直接开启Remote，也可以正确识别。

到这里，我们已经顺利完成了WSL2+Docker+EasyConnect+Clash的全工具链配置。还愣着干啥，赶紧摸🐟啊（x）

## XMU特供：并不万能的SSLVPN

对其他学校的同学们，看到这里可以关掉了。<del>因为我也不知道后面的该怎么写了（x）</del>

但是对于XMU的同学们来说，似乎还差了点什么。没错，就是CNKI。

非常遗憾，XMU的SSLVPN只能支持校内IP的代理，换言之包括CNKI和各大期刊的网站，都只能用WebVPN访问。

因此上文中我只配置了课题组的几个IP，而没有做更进一步的设置。

好在，[@spencerwoo](https://github.com/spencerwooo)大佬制作了一个[网站](https://webvpn.vercel.app/)并[开源](https://github.com/spencerwooo/bit-webvpn-converter)，可以转换任意网址到BIT的WebVPN。因此我Fork了原仓库并[依样画葫芦](https://github.com/Cloudac7/xmu-webvpn-converter)，制作了适用于XMU的版本——[XMU WEBVPN Converter](https://cloudac7.github.io/xmu-webvpn-converter/)，托管到Github Pages上。

使用方法非常简单，只需在Original URL中输入原始链接，点击中间的绿色按钮，即可在下方得到转换后的链接。可以选择打开或者复制。

![image-20220323123951006](https://s2.loli.net/2022/03/23/a8NlfuSbjLzd674.png)

拜其所赐，我可以直接使用404学术搜索，然后把链接粘贴到这里获取WebVPN地址并访问、下载原始文献。

妈妈再也不用担心导师在微信群发文献链接了（笑）

以上，开启疫情下的快乐科研吧♥
