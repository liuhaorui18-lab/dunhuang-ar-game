/* ═══════════════════════════════════════════════════════
   敦煌复苏计划 — config.js
   所有对话脚本 + 游戏参数 + 谜题数据
   ═══════════════════════════════════════════════════════ */

// ─── 对话脚本 ──────────────────────────────────────────
const Dialogues = {

  /* ═══ 考古学家线 ═══ */
  arch_opening: [
    { speaker:'*', text:'……看得到吗？你好？' },
    { speaker:'-', text:'你好？' },
    { speaker:'*', text:'太好了，你就是那个考古学家对吧！是我，程序员，终于联系上你了。我还以为……嗯，你已经到洞窟面前了，对吗？' },
    { speaker:'-', text:'……' },
    { speaker:'*', text:'还没有。好。我们得抓紧了，根据测算，下一次坍塌很快就会发生，那个洞窟会变成一片废墟。所以，接下来，认真听我说的每一句话，我能带你找到那里。' },
    { speaker:'*', text:'你手里有一台机器对不对？没错，就是用来联系我的这台，上面搭载了AI智能程序，我会用它来帮助你。现在，把它的摄像头对准你周围的岩壁，任何一面。' },
    { speaker:'*', text:'（提示：请将手机对准附近的墙壁。）' },
  ],

  arch_wall_cant: [
    { speaker:'*', text:'不是这里。换一面岩壁，快，我们没有时间了。' },
  ],

  arch_wall_can: [
    { speaker:'*', text:'对，就是这里，现在拿起你的工具，跟上我的提示，清理掉这些挡路的石头。力道一定要适中，山体现在很不稳定。小心行事！' },
  ],

  arch_excavation_start: [
    { speaker:'*', text:'选取工具，跟随屏幕上的提示完成开凿。请注意，开凿力度不要过大或者过小，否则会影响山体的稳定性，造成严重的后果。' },
  ],

  arch_excavation_hard: [
    { speaker:'*', text:'等等！别那么用力，很危险！' },
    { speaker:'*', text:'不是这样！冷静，冷静一点！' },
    { speaker:'*', text:'轻一点！山体不稳定！' },
  ],

  arch_excavation_soft: [
    { speaker:'*', text:'加快速度。' },
    { speaker:'*', text:'紧迫感，来点紧迫感！用力！' },
    { speaker:'*', text:'加油，加油！' },
  ],

  arch_excavation_good: [
    { speaker:'*', text:'很好！' },
    { speaker:'*', text:'就这样！' },
    { speaker:'*', text:'没错！' },
    { speaker:'*', text:'下一个！' },
    { speaker:'*', text:'继续保持！' },
  ],

  arch_excavation_done: [
    { speaker:'*', text:'很好，数据显示只要再——小心！后退几步！' },
  ],

  arch_after_collapse: [
    { speaker:'-', text:'……你还好吗？' },
    { speaker:'*', text:'什么？' },
    { speaker:'*', text:'哦哦……好，很好，非常好。幸好我们来得及。让我……' },
    { speaker:'*', text:'哦，对了。看得到吗？我把跟这里有关的一些提示传给你了。它可能有点……多，不过没关系，我相信你。抓住它们！' },
  ],

  arch_clue_done: [
    { speaker:'*', text:'我的天啊。你找到正确信息了吧？抱歉，我也没想到会有这么多。它们到处乱飞，你也看到了？以前发生过这种情况，但在这么紧要的关头还是第一次……' },
  ],

  arch_countdown: [
    { speaker:'*', text:'我们的时间不多了！你看到弹窗了吗，那是洞窟坍塌的倒计时，你必须在倒计时结束之前离开这个洞窟，不然就会被埋在里面。和文物一起……不不不不别担心，我会帮你尽可能多地带走文物的。相信我！' },
  ],

  arch_walking: [
    { speaker:'*', text:'……嗯？快，快走。' },
    { speaker:'*', text:'小心脚下！' },
    { speaker:'*', text:'我们一定可以的。' },
    { speaker:'*', text:'时间不多了！' },
  ],

  arch_exploring: [
    { speaker:'*', text:'当心！' },
    { speaker:'*', text:'注意脚下……' },
    { speaker:'*', text:'看那边！' },
  ],

  /* ── 壁画 ── */
  mural_no_clue: [
    { speaker:'*', text:'这个……它被破坏得太过彻底，已经无法修复了。去看看其他地方吧。' },
  ],
  mural_has_clue: [
    { speaker:'*', text:'等一下。' },
    { speaker:'*', text:'我知道这是什么！把周围的碎片收集起来，快，只要能拼个大概，再拍摄下来，我没准就能利用现有的技术修复它！' },
  ],
  mural_success: [
    { speaker:'*', text:'太好了！把摄像头对准它……我们成功了！' },
  ],
  mural_fail: [
    { speaker:'*', text:'等等。等等、等等，快点——快跑！' },
  ],

  /* ── 经卷 ── */
  scripture_no_clue: [
    { speaker:'*', text:'唉……这么珍贵的文物……没时间哀悼了，我们走吧。' },
  ],
  scripture_has_clue: [
    { speaker:'*', text:'凑近点。1、2、3、4……我好像知道这卷经文。它们应该是这样排列的——' },
  ],
  scripture_success: [
    { speaker:'*', text:'这就是那卷经文！它失传很久了，我的天啊。带走它，一定要带走它！' },
  ],
  scripture_fail: [
    { speaker:'*', text:'不对，不是这样，顺序错了。不对……' },
  ],

  /* ── 大佛像 ── */
  buddha_no_clue: [
    { speaker:'*', text:'这是从洞窟顶上掉下来的吗？快走吧，类似的石头随时可能再次从头顶滚下来。' },
  ],
  buddha_has_clue: [
    { speaker:'*', text:'你觉不觉得它长得……如果没有灰尘和沙土，上面像不像刻着一只眼睛？' },
  ],
  buddha_success: [
    { speaker:'*', text:'这就是一只眼睛！佛像，是佛头的一部分！可惜没时间把整个佛像运送出去。别动，我在扫描它。' },
  ],
  buddha_fail: [
    { speaker:'*', text:'没准它就是一块石头，可能是我看错了，它……小心头顶！' },
  ],

  /* ── 小佛像 ── */
  statue_no_clue: [
    { speaker:'*', text:'什么……没事，你一定是看错了。' },
  ],
  statue_has_clue: [
    { speaker:'*', text:'等一下！那边不太对劲，是不是有什么东西在发光？' },
  ],
  statue_success: [
    { speaker:'*', text:'我就知道！我就知道那不是石头！把它带出去，能多带一个就多带一个！' },
  ],
  statue_fail: [
    { speaker:'*', text:'把火把拿远一点，会晃到摄像头，对，我看不……等等，注意时间！' },
  ],

  /* ── 考古学家结局 ── */
  arch_ending: [
    { speaker:'*', text:'……你还好吗？' },
    { speaker:'-', text:'还好。刚才多亏你及时提醒。' },
    { speaker:'*', text:'那就好。可惜，它还是彻底坍塌了。跟我知道的一样……' },
    { speaker:'-', text:'什么？' },
    { speaker:'*', text:'没事！我的意思是，AI算出它百分之九十九会坍塌，但我总抱有侥幸心理，期待我们遇到的情况是那百分之一。不过，多亏了你，刚才抢救出来的文物我已经全部扫描好了，这下修复应该会变得轻松很多。' },
    { speaker:'-', text:'你从事文物修复方面的工作吗？' },
    { speaker:'*', text:'不是。应该说，不全是。但是，放心，我绝对能修好它们。好啦，辛苦了，快去休息吧。下次见！' },
    { speaker:'-', text:'下次见。' },
  ],

  /* ── 笔记本 ── */
  notebook_found: [
    { speaker:'*', text:'这里面是什么……？' },
  ],
  notebook_unlock_hint: [
    { speaker:'*', text:'肯定有办法能打开它。我查查资料……笔记本……密码……四位数字……会不会是谁的生日？' },
  ],
  notebook_unlocked: [
    { speaker:'-', text:'看起来这是一本图鉴。里面有很多珍贵的影像资料……是前来考古的前辈留下的？' },
    { speaker:'*', text:'好全面的资料……' },
    { speaker:'*', text:'等一下。有点不对劲……' },
    { speaker:'-', text:'怎么了？' },
    { speaker:'*', text:'……帮我个忙。我想把每一页都拍下来，用来辅助研究。如果还有时间的话，我想仔细看看另一边的壁画……' },
  ],

  /* ═══ 程序员线 ═══ */
  prog_opening: [
    { speaker:'-', text:'……你好？程序员，你还在吗？' },
    { speaker:'*', text:'啊！对不起。我刚才好像走神了。我们进行到哪一步了？稍等，我的设备进入睡眠模式了。我得找一块合适的屏幕……' },
  ],

  prog_wall_init: [
    { speaker:'*', text:'好了。让我想想我们接下来要做什么。你是考古学家。你在开凿洞窟。你已经在洞窟面前了对吗，快要二次坍塌、需要紧急抢修文物的那个？你在挖进去的通道吗？' },
    { speaker:'-', text:'嗯。已经挖到一半了。' },
    { speaker:'*', text:'挖到一半了！你一直在原地等我吗？真对不起，我们现在就继续开挖吧，我会继续协助你的。你只要跟着我的提示继续工作就好。这样能为我们争取最多时间。' },
    { speaker:'*', text:'传回来的数据也太多了……' },
    { speaker:'*', text:'算了，我能处理。注意听我的指令，三、二、一——' },
  ],

  prog_shoot_done: [
    { speaker:'*', text:'呼——' },
    { speaker:'*', text:'总算结束了。你那边情况如何？有没有受伤，又或者，有没有新的发现？' },
    { speaker:'-', text:'我没事。洞窟里面很黑，看不清里面的状况。' },
    { speaker:'*', text:'你有没有照明用的设备？我把关于文物的线索发给你。怎么这么多……！线索、线索……到底在哪里……' },
    { speaker:'-', text:'……你还好吗？' },
    { speaker:'*', text:'好，我很好。我只是……' },
    { speaker:'*', text:'我有一点理不清……' },
  ],

  prog_maze_fail: [
    { speaker:'*', text:'不对不对不对。不是这样的。' },
    { speaker:'-', text:'你在做什么……？' },
    { speaker:'*', text:'等我一下……' },
  ],

  prog_maze_success: [
    { speaker:'*', text:'对了！就是这样！' },
    { speaker:'*', text:'好了！我把数据和关于文物的信息发给你。有了这些线索，我们的进展一定能更加顺利。抓住它们！' },
    { speaker:'-', text:'抓住……？' },
    { speaker:'-', text:'……' },
    { speaker:'-', text:'……真是太感谢你了。' },
    { speaker:'*', text:'不用谢，这是我应该做的。那么，接下来——' },
  ],

  prog_countdown: [
    { speaker:'*', text:'怎么只剩这么点时间了……' },
    { speaker:'*', text:'我们的时间不多了！你看到弹窗了吗，那是洞窟坍塌的倒计时，你必须在倒计时结束之前离开这个洞窟，不然就会被埋在里面。和文物一起……不不不不别担心，我会帮你尽可能多地带走文物的。相信我！' },
    { speaker:'*', text:'你进去了吗？' },
    { speaker:'-', text:'我进去了。' },
    { speaker:'*', text:'好。我会一直提醒你的。如果找到了文物，记得把它们的照片传给我。' },
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

// ─── 游戏参数 ──────────────────────────────────────────
const GameConfig = {
  // 开凿音游
  excavation: {
    totalNotes: 12,       // 需要击中的总节拍数
    lanes: 5,             // 轨道数
    hitWindow: 120,       // 判定窗口(ms) — perfect
    goodWindow: 250,      // 判定窗口(ms) — good
    noteSpeed: 2.5,       // 节拍下落速度
    spawnInterval: 800,   // 节拍生成间隔(ms)
    forceThreshold: 0.3,  // 力度偏离阈值
  },

  // 线索捕捉
  clueCatch: {
    duration: 18,         // 持续时间(秒)
    targetClues: 2,       // 需要捕获的线索数
    clueSpeed: 1.8,       // 线索飞行速度
    spawnInterval: 1500,  // 生成间隔(ms)
    clueTypes: ['mural','scripture','buddha','statue'],
    junkTypes: ['junk1','junk2','junk3','junk4'],
  },

  // 洞窟探索倒计时（会被音游结果覆盖）
  exploreCountdown: {
    defaultMinutes: 3,
    defaultSeconds: 50,
  },

  // 壁画拼图
  mural: {
    pieces: 4,            // 碎片数
    rotationSteps: 8,     // 旋转精度
  },

  // 经卷排序
  scripture: {
    items: 6,             // 经卷数量
  },

  // 大佛像清扫
  buddha: {
    dustPatches: 5,       // 需要清扫的区域数
    swipeThreshold: 80,   // 滑动距离阈值
  },

  // 小佛像烛光
  candle: {
    requiredTaps: 3,      // 需要点亮的次数
    visibleDuration: 2500,// 每次可见时长(ms)
    hideInterval: 3000,   // 隐藏间隔(ms)
  },

  // 程序员数据击碎
  dataShoot: {
    totalRounds: 3,       // 需要完成的数据包
    roundDuration: 20,    // 每轮时间(秒)
    redSpeed: 2.0,        // 红色碎片速度
    blueSpeed: 1.5,       // 蓝色碎片速度
    spawnInterval: 600,   // 生成间隔(ms)
  },

  // 迷宫
  maze: {
    cols: 15,
    rows: 20,
    cellSize: 28,         // 单元格大小(px)
  },

  // 照片拼图
  photoPuzzle: {
    puzzles: 2,           // 需要完成的拼图数
    pieces: 6,            // 每图碎片数
  },
};

// ─── 谜题正确答案 ──────────────────────────────────────
const PuzzleAnswers = {
  // 经卷正确顺序（左1~左6 的排序索引，0-based）
  scriptureOrder: [0, 2, 4, 1, 3, 5],

  // 壁画拼图最终旋转角度（每个碎片的正确角度 0~7，对应 0°~315°）
  muralAngles: [0, 2, 4, 6],

  // 笔记本密码
  notebookCode: '1900',
};

// ─── 预加载资源列表 ────────────────────────────────────
const PreloadAssets = {
  critical: [
    'assets/背景组件/背景.png',
    'assets/游戏开始页面/敦煌复苏计划（标题字）.png',
    'assets/游戏开始页面/背景图.png',
    'assets/常用ui/顶部字幕弹窗.png',
    'assets/常用ui/顶部字幕继续按钮.png',
    'assets/常用ui/瞄准框.png',
    'assets/常用ui/操作提示框.png',
    'assets/对话框/对话框背景.png',
    'assets/对话框/对话框装饰.png',
    'assets/对话框/关闭对话框.png',
    'assets/对话框/对话框本体.png',
    'assets/开凿过程（音游）/音游按钮.png',
    'assets/找线索/画面中间选择ui.png',
  ],

  // 按需加载的其他资源
  deferred: [
    'assets/壁画碎片/壁画碎片页面/普通状态碎片.png',
    'assets/壁画碎片/壁画碎片页面/普通状态碎片2.png',
    'assets/壁画碎片/壁画碎片页面/普通状态碎片3.png',
    'assets/壁画碎片/壁画碎片页面/提示状态碎片.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片2.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片3.png',
    'assets/壁画碎片/壁画移动页面/普通状态碎片 4.png',
    'assets/壁画碎片/拼合成功页面/完整壁画.png',
    'assets/神像碎片/界面1/左边神像.png',
    'assets/神像碎片/界面1/中间神像.png',
    'assets/神像碎片/界面1/右边神像.png',
    'assets/神像碎片/拼合好界面3/拼合好神像.png',
    'assets/神像碎片/神像5/清灰后.png',
    'assets/程序碎块/红色1.png',
    'assets/程序碎块/红色2.png',
    'assets/程序碎块/红色 3.png',
    'assets/程序碎块/蓝色1.png',
    'assets/程序碎块/蓝色2.png',
    'assets/程序碎块/蓝色3.png',
    'assets/经书/左1固定.png','assets/经书/左2固定.png','assets/经书/左3固定.png',
    'assets/经书/左4固定.png','assets/经书/左5固定.png',
    'assets/小佛像/小佛像.png',
    'assets/小佛像/蜡烛.png',
    'assets/小佛像/光标.png',
    'assets/小佛像/石块1.png','assets/小佛像/石块2.png','assets/小佛像/石块3.png',
  ]
};
