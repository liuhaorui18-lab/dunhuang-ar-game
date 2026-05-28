/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — config.js
   对话脚本 · 游戏参数 · 谜题答案
   ═══════════════════════════════════════════════════════ */

const Dialogues = {
  arch_open: [
    { speaker:'*', text:'……看得到吗？你好？' },
    { speaker:'-', text:'你好？' },
    { speaker:'*', text:'太好了，你就是那个考古学家对吧！是我，程序员，终于联系上你了。我已经到洞窟面前了，对吗？' },
    { speaker:'-', text:'……' },
    { speaker:'*', text:'还没有。好。我们得抓紧了，根据测算，下一次坍塌很快就会发生。所以，认真听我说的每一句话，我能带你找到那里。' },
    { speaker:'*', text:'你手里有一台机器对不对？把它的摄像头对准你周围的岩壁，任何一面。' },
  ],
  arch_wall_ok: [
    { speaker:'*', text:'对，就是这里，现在拿起你的工具，跟上我的提示，清理掉这些挡路的石头。力道一定要适中！' },
  ],
  arch_ex_done: [
    { speaker:'*', text:'很好，数据显示只要再——小心！后退几步！' },
  ],
  arch_collapse: [
    { speaker:'-', text:'……你还好吗？' },
    { speaker:'*', text:'哦哦……好，很好。幸好我们来得及。我把跟这里有关的一些提示传给你了。它可能有点多，不过没关系，我相信你。抓住它们！' },
  ],
  arch_clue_ok: [
    { speaker:'*', text:'我的天啊。你找到正确信息了吧？抱歉，我也没想到会有这么多。在这么紧要的关头还是第一次……' },
  ],
  arch_timer: [
    { speaker:'*', text:'我们的时间不多了！你看到弹窗了吗，那是洞窟坍塌的倒计时，你必须在倒计时结束之前离开，不然就会被埋在里面。别担心，我会帮你尽可能多地带走文物的。相信我！' },
  ],
  mural_no: [{ speaker:'*', text:'这个……它被破坏得太过彻底，已经无法修复了。去看看其他地方吧。' }],
  mural_ok: [{ speaker:'*', text:'等一下。我知道这是什么！把周围的碎片收集起来，快，只要能拼个大概，再拍摄下来，我没准就能利用现有的技术修复它！' }],
  mural_win: [{ speaker:'*', text:'太好了！把摄像头对准它……我们成功了！' }],
  mural_lose: [{ speaker:'*', text:'等等。来不及了……快去下一个地方！' }],
  scrip_no: [{ speaker:'*', text:'唉……这么珍贵的文物……没时间哀悼了，我们走吧。' }],
  scrip_ok: [{ speaker:'*', text:'凑近点。1、2、3、4……我好像知道这卷经文。它们应该是这样排列的——' }],
  scrip_win: [{ speaker:'*', text:'这就是那卷经文！它失传很久了，我的天啊。带走它，一定要带走它！' }],
  scrip_lose: [{ speaker:'*', text:'不对，不是这样，顺序错了。没关系，时间不多了，我们先走！' }],
  buddha_no: [{ speaker:'*', text:'这是从洞窟顶上掉下来的吗？快走吧，类似的石头随时可能再次从头顶滚下来。' }],
  buddha_ok: [{ speaker:'*', text:'你觉不觉得它长得……如果没有灰尘和沙土，上面像不像刻着一只眼睛？' }],
  buddha_win: [{ speaker:'*', text:'这就是一只眼睛！佛像，是佛头的一部分！可惜没时间把整个佛像运送出去。别动，我在扫描它。' }],
  buddha_lose: [{ speaker:'*', text:'没准它就是一块石头。小心头顶！我们去看下一个。' }],
  statue_no: [{ speaker:'*', text:'什么……没事，你一定是看错了。' }],
  statue_ok: [{ speaker:'*', text:'等一下！那边不太对劲，是不是有什么东西在发光？' }],
  statue_win: [{ speaker:'*', text:'我就知道！我就知道那不是石头！把它带出去，能多带一个就多带一个！' }],
  statue_lose: [{ speaker:'*', text:'把火把拿远一点，会晃到摄像头……算了，注意时间！我们走。' }],
  arch_ending: [
    { speaker:'*', text:'……你还好吗？' },
    { speaker:'-', text:'还好。刚才多亏你及时提醒。' },
    { speaker:'*', text:'那就好。可惜，它还是彻底坍塌了。不过，多亏了你，刚才抢救出来的文物我已经全部扫描好了，这下修复应该会变得轻松很多。' },
    { speaker:'-', text:'你从事文物修复方面的工作吗？' },
    { speaker:'*', text:'不是。应该说，不全是。但是，放心，我绝对能修好它们。好啦，辛苦了，快去休息吧。下次见！' },
    { speaker:'-', text:'下次见。' },
  ],
  prog_open: [
    { speaker:'-', text:'……你好？程序员，你还在吗？' },
    { speaker:'*', text:'啊！对不起。我刚才好像走神了。我们进行到哪一步了？稍等，我的设备进入睡眠模式了。我得找一块合适的屏幕……' },
  ],
  prog_init: [
    { speaker:'*', text:'好了。让我想想……你是考古学家。你在开凿洞窟。你已经在洞窟面前了对吗？' },
    { speaker:'-', text:'嗯。已经挖到一半了。' },
    { speaker:'*', text:'挖到一半了！你一直在原地等我吗？真对不起，我们现在就继续开挖吧。传回来的数据也太多了……' },
    { speaker:'*', text:'算了，我能处理。注意听我的指令，三、二、一——' },
  ],
  prog_shoot_ok: [
    { speaker:'*', text:'呼——总算结束了。你那边情况如何？' },
    { speaker:'-', text:'我没事。洞窟里面很黑，看不清里面的状况。' },
    { speaker:'*', text:'我把关于文物的线索发给你。怎么这么多……！到底在哪里……' },
    { speaker:'-', text:'……你还好吗？' },
    { speaker:'*', text:'好，我很好。我只是……我有一点理不清……' },
  ],
  prog_maze_ok: [
    { speaker:'*', text:'对了！就是这样！' },
    { speaker:'*', text:'好了！我把数据和关于文物的信息发给你。有了这些线索，我们的进展一定能更加顺利。' },
    { speaker:'-', text:'……真是太感谢你了。' },
  ],
  prog_countdown: [
    { speaker:'*', text:'怎么只剩这么点时间了……我们的时间不多了！你看到弹窗了吗，那是洞窟坍塌的倒计时。' },
    { speaker:'*', text:'你进去了吗？' },
    { speaker:'-', text:'我进去了。' },
    { speaker:'*', text:'好。如果找到了文物，记得把它们的照片传给我。' },
  ],
  prog_ending: [
    { speaker:'*', text:'数据传输完成……文物修复进度百分之百。' },
    { speaker:'*', text:'虽然洞窟已经坍塌了，但我们抢救回来了足够多的数据。用这些资料，我们可以在虚拟空间中重建整个洞窟。' },
    { speaker:'-', text:'这就是你一直在做的事情吗？' },
    { speaker:'*', text:'是的。用代码保存那些注定要消失的东西。挺可笑的，对吧？' },
    { speaker:'-', text:'不。这就是记住的方式。' },
    { speaker:'*', text:'……谢谢。下次见。' },
  ],
};

const Config = {
  ex: { total: 12, lanes: 5, speed: 2.5, radius: 22, hitGood: 250, hitPerfect: 120, spawnMs: 750 },
  cc: { dur: 20, need: 2, spawnMs: 1400 },
  mural: { pieces: 4, rot: 8 },
  scrip: { items: 6 },
  buddha: { patches: 5 },
  candle: { taps: 3, visible: 2200, hide: 2800 },
  ds: { rounds: 3, hp: 5, redSpd: 2, blueSpd: 1.5, spawnMs: 550 },
  maze: { cols: 14, rows: 18, cell: 28 },
  pp: { count: 2, pieces: 6 },
};

const Answers = {
  scripOrder: [2, 0, 5, 3, 4, 1],
  muralAngles: [0, 2, 4, 6],
};

const PreloadList = [
  'assets/游戏开始页面/背景图.png',
  'assets/游戏开始页面/敦煌复苏计划（标题字）.png',
  'assets/常用ui/顶部字幕弹窗.png',
  'assets/常用ui/顶部字幕继续按钮.png',
  'assets/常用ui/瞄准框.png',
  'assets/常用ui/操作提示框.png',
  'assets/对话框/对话框背景.png',
  'assets/对话框/对话框本体.png',
  'assets/对话框/各种需要用到框框的ui（比如小弹窗）.png',
  'assets/开凿过程（音游）/音游按钮.png',
];
