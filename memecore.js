const { HttpsProxyAgent } = require("https-proxy-agent");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const colors = require("colors");
const readline = require("readline");
const { time } = require("console");

const configPath = path.join(process.cwd(), "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

const baseUrl = "https://memes-war.memecore.com/api/"

class MinersClub {
  constructor() {
    this.headers = {
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US",
      Origin: "https://memes-war.memecore.com",
      "Referer": "https://memes-war.memecore.com/",
      "Content-Type": "application/json",
      "Sec-Ch-Ua":
        '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      "Sec-Ch-Ua-Mobile": "?1",
      "Sec-Ch-Ua-Platform": '"Android"',
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Site": "same-site",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    };
    this.line = "~".repeat(42).white;
  }

  async waitWithCountdown(seconds) {
    for (let i = seconds; i >= 0; i--) {
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(
        `===== Đã hoàn thành tất cả tài khoản, chờ ${i} giây để tiếp tục vòng lặp =====`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    console.log("");
  }

  getUserAgent(index) {
    const userAgentFilePath = path.join(__dirname, 'useragent.txt');
    const userAgents = fs.readFileSync(userAgentFilePath, 'utf-8').split('\n').filter(Boolean);
    const validUserAgents = userAgents.map(ua => ua.replace(/[^\x20-\x7E]/g, ''));
    return validUserAgents[index];
  }

  log(msg, proxyIP) {
    const time = new Date().toLocaleString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    console.log(`[${time}] > ${proxyIP || "local"} > ${msg}`.cyan);
  }

  async sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async title() {
    console.clear();
    console.log(`
                ███████╗███████╗██████╗ ███╗   ███╗ ██████╗ 
                ╚══███╔╝██╔════╝██╔══██╗████╗ ████║██╔═══██╗
                  ███╔╝ █████╗  ██████╔╝██╔████╔██║██║   ██║
                 ███╔╝  ██╔══╝  ██╔═══╝ ██║╚██╔╝██║██║   ██║
                ███████╗███████╗██║     ██║ ╚═╝ ██║╚██████╔╝
                ╚══════╝╚══════╝╚═╝     ╚═╝     ╚═╝ ╚═════╝ 
                `);
    console.log(
      colors.yellow(
        "Tool này được làm bởi Zepmo. Nếu bạn thấy hay thì hãy ủng hộ mình 1 subscribe nhé!"
      )
    );
    console.log(
      colors.blue(
        "Liên hệ Telegram: https://t.me/@zepmoairdrop \n"
      )
    );
  }

  getUserData(queryString) {
    const params = new URLSearchParams(queryString);
    const user = JSON.parse(decodeURIComponent(params.get("user")));
    const authDate = new Date(parseInt(params.get("auth_date")) * 1000).toISOString();
    return {
        authDate,
        chatInstance: params.get("chat_instance"),
        chatType: params.get("chat_type"),
        hash: params.get("hash"),
        startParam: config.invite_code,
        user: {
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name || "",
            username: user.username,
            languageCode: user.language_code,
            isPremium: true,
            allowsWriteToPm: user.allows_write_to_pm
        }
    };
}

  getAxiosConfig(proxy, index, data) {
    const header = {
      ...this.headers,
      "User-Agent": this.getUserAgent(index),
      "cookie": `telegramInitData=${data}`
    }
    if (proxy != null) {
      return {
        headers: header,
        httpsAgent: new HttpsProxyAgent(proxy),
        timeout: config.timeout,
      }
    }
    return {
      headers: header,
      timeout: config.timeout,
    }
  }

  async getUserInfo(data, proxy, index, proxyIP) {
    const url = `${baseUrl}user`;
    try {
      const res = await axios.get(url, this.getAxiosConfig(proxy, index, data));
      if (res?.data.data) {
        const userData = res.data.data.user
        const { honorPoints, warbondTokens, honorPointRank } = userData;
        this.log(`[Account ${index}] Honor Points: ${honorPoints} | Warbond Tokens: ${warbondTokens} | Honor Point Rank: ${honorPointRank}`.magenta, proxyIP);
        if (!userData?.inputReferralCode) {
          await this.setRefferal(data, proxy, index, proxyIP);
        }
        return userData;
      } else {
      }
    } catch (error) {
      console.log(error?.response?.data);
      this.log(`[Account ${index}] Error getting user info: ${error.message}`.red, proxyIP);
      return null;
    }
  }

  async setRefferal(data, proxy, index, proxyIP) {
    const url = `${baseUrl}user/referral/${config.invite_code}`;
    try {
      const res = await axios.put(url, {}, this.getAxiosConfig(proxy, index, data));
      if (res?.status === 200) {
        this.log(`[Account ${index}] Referral code added successfully!`.blue, proxyIP);
      } else {
        this.log(`[Account ${index}] Referral code not added!`.red, proxyIP);
      }
    } catch (error) {
      this.log(`[Account ${index}] Referral code not added: ${error.message}`.red, proxyIP);
    }
  }

  async checkTreasuryRewards(data, proxy, index, proxyIP) {
    const url = `${baseUrl}quest/treasury/rewards`;
    try {
      const res = await axios.get(url, this.getAxiosConfig(proxy, index, data));
      if (res?.data.data) {
        return res.data.data;
      }
    } catch (error) {
      this.log(`[Account ${index}] Error checking treasury rewards: ${error.message}`.red, proxyIP);
    }
  }

  async claimTreasuryRewards(data, proxy, index, proxyIP) {
    const url = `${baseUrl}quest/treasury`;
    try {
      const res = await axios.post(url, {}, this.getAxiosConfig(proxy, index, data));
      if (res?.status === 200) {
        return res.data.data;
      } else {
        this.log(`[Account ${index}] Treasury rewards not claimed!`.red, proxyIP);
      }
    } catch (error) {
      this.log(`[Account ${index}] Treasury rewards not claimed: ${error.message}`.red, proxyIP);
    }
  }

  async processTreasury(data, proxy, index, proxyIP) {
    const checkResult = await this.checkTreasuryRewards(data, proxy, index, proxyIP);
    if (!checkResult) {
      this.log(`[Account ${index}] Error checking treasury rewards!`.red, proxyIP);
      return;
    }
    const { leftSecondsUntilTreasury, rewards } = checkResult;
    
    if (leftSecondsUntilTreasury === 0) {
      this.log(`[Account ${index}] Claiming $War.Bond...`.yellow, proxyIP)
      const claimResult = await this.claimTreasuryRewards(data, proxy, index, proxyIP)

      if (claimResult) {
        const rewardAmount = claimResult?.rewards[0].rewardAmount;
        this.log(`[Account ${index}] Claim ${rewardAmount} $War.Bond successful!`.green, proxyIP)
        this.log(`[Account ${index}] Next time: ${claimResult?.leftSecondsUntilTreasury} second!`.yellow, proxyIP)
      } 
    } else {
      this.log(`[Account ${index}] Next time claim unitl ${leftSecondsUntilTreasury} secound!`.yellow, proxyIP)
    }
  }

  async checkCheckInStatus(data, proxy, index, proxyIP ) {
    const url = `${baseUrl}quest/check-in`
    try {
      const res = await axios.get(url, this.getAxiosConfig(proxy, index, data))
      if (res?.data.data) {
        return res.data.data
      }
    } catch (error) {
      this.log(`[Account ${index}] Error checking check-in status: ${error.message}`.red, proxyIP)
    }
  }

  async performCheckIn(data, proxy, index, proxyIP) {
    const url = `${baseUrl}quest/check-in`
    try {
      const res = await axios.post(url, {}, this.getAxiosConfig(proxy, index, data))
      if (res?.status === 200) {
        return res.data.data
      } else {
        this.log(`[Account ${index}] Check-in not performed!`.red, proxyIP)
      }
    } catch (error) {
      this.log(`[Account ${index}] Check-in not performed: ${error.message}`.red, proxyIP)
    }
  }

  async processCheckIn(data, proxy, index, proxyIP) {
    const checkResult = await this.checkCheckInStatus(data, proxy, index, proxyIP)
    if (!checkResult) {
      this.log(`[Account ${index}] Error checking check-in status!`.red, proxyIP)
      return
    }

    const { checkInRewards } = checkResult;
    const claimableReward = checkInRewards.find(reward => reward.status === 'CLAIMABLE');

    if (claimableReward) {
      this.log(`[Account ${index}] Performing check-in...`.yellow, proxyIP)
      const checkInResult = await this.performCheckIn(data, proxy, index, proxyIP)
      
      if (checkInResult) {
        const { currentConsecutiveCheckIn, rewards } = checkInResult
        const rewardText = rewards.map(reward => {
          if (reward.rewardType === 'WARBOND') {
              return `${reward.rewardAmount} $War.Bond`;
          } else if (reward.rewardType === 'HONOR_POINT') {
              return `${reward.rewardAmount} Honor Points`;
          }
          return `${reward.rewardAmount} ${reward.rewardType}`;
      }).join(' + ');
      
      this.log(`[Account ${index}] Check-in day: ${currentConsecutiveCheckIn} | Reward: ${rewardText}`.green, proxyIP);
      }

    } else {
      this.log(`[Account ${index}] Check-in already performed today!`.yellow, proxyIP)
    }
  }

  async checkGuildStatus(data, proxy, index, proxyIP, guildId) {
    const url = `${baseUrl}guild/${guildId}`
    try {
      const res = await axios.get(url, this.getAxiosConfig(proxy, index, data))
      if (res?.data.data) {
        this.log(`[Account ${index}] Guild ${res?.data.data.name}: ${res?.data.data.warbondTokens} $War.Bond`.magenta, proxyIP)
        return res.data.data
      }
    } catch (error) {
      this.log(`[Account ${index}] Error checking guild status: ${error.message}`.red, proxyIP)
    }
  }

  async checkFavoriteGuild(data, proxy, index, proxyIP) {
    const url = `${baseUrl}guild/list/favorite?start=0&count=10`
    try {
      const res = await axios.get(url, this.getAxiosConfig(proxy, index, data))
      if (res?.data.data) {
        return res.data.data
      }
    } catch (error) {
      this.log(`[Account ${index}] Error checking favorite guild: ${error.message}`.red, proxyIP)
    }
  }

  async favoriteGuild(data, proxy, index, proxyIP, guildId) {
    const url = `${baseUrl}guild/favorite`
    try {
      const res = await axios.post(url, { guildId }, this.getAxiosConfig(proxy, index, data))
      if (res?.status === 200) {
        return true
      } else {
        this.log(`[Account ${index}] Guild not favorited!`.red, proxyIP)
      }
    } catch (error) {
      this.log(`[Account ${index}] Guild not favorited: ${error.message}`.red, proxyIP)
    }
  }

  async transferWarbondToGuild(data, proxy, index, proxyIP, guildId, warbondCount) {
    const url = `${baseUrl}guild/warbond`
    const payload = {
      guildId: guildId,
      warbondCount: parseInt(warbondCount)
    }
    try {
      const res = await axios.post(url, payload, this.getAxiosConfig(proxy, index, data))
      if (res?.status === 200) {
        return true
      } else {
        this.log(`[Account ${index}] Error transfer warbound to guild!`.red, proxyIP)
      }
    } catch (error) {
      this.log(`[Account ${index}] Error transfer warbound to guild: ${error.message}`.red, proxyIP)
    }
  }

  async processGuildOperations(data, proxy, index, proxyIP) {
    const userInfoResult = await this.getUserInfo(data, proxy, index, proxyIP);
    if (!userInfoResult) return;
    const warbondTokens = parseInt(userInfoResult?.warbondTokens)
    if (warbondTokens <= config.MIN_WARBOND_THRESHOLD) {
      this.log(`[Account ${index}] Số dư $War.Bond (${warbondTokens}) không đủ để chuyển`.yellow)
      return
    }

    const guildStatus = await this.checkGuildStatus(data, proxy, index, proxyIP, config.TARGET_GUILD_ID)
    const favoriteGuilds = await this.checkFavoriteGuild(data, proxy, index, proxyIP)
    if (favoriteGuilds) {
      const isGuildFavorited = favoriteGuilds.guilds.some(guild => guild.guildId === config.TARGET_GUILD_ID)
      if (!isGuildFavorited) {
        this.log(`[Account ${index}] Add guild to favorite...`.yellow, proxyIP)
        await this.favoriteGuild(data, proxy, index, proxyIP, config.TARGET_GUILD_ID)
      }
    }

    this.log(`[Account ${index}] Transfer ${warbondTokens} $War.Bond to guild...`.yellow, proxyIP)
    const transferResult = await this.transferWarbondToGuild(data, proxy, index, proxyIP, config.TARGET_GUILD_ID, warbondTokens.toString())
    if (transferResult) {
      this.log(`[Account ${index}] Transfer $War.Bond to guild successful!`.green, proxyIP)
    }
  }

  async getQuest(data, proxy, index, proxyIP) {
    try {
      const [dailyRes, singleRes] = await Promise.all([
        axios.get(`${baseUrl}quest/daily/list`,  this.getAxiosConfig(proxy, index, data)),
        axios.get(`${baseUrl}quest/general/list`,  this.getAxiosConfig(proxy, index, data))
      ])
      if (dailyRes.status) {
        const dailyQuests = dailyRes.data.data.quests.map(quest => ({ ...quest, questType: 'daily' }));
        const singleQuests = singleRes.data.data.quests.map(quest => ({ ...quest, questType: 'general' }));
        return [...dailyQuests, ...singleQuests]
      } else {
        this.log(`[Account ${index}] Error get quest!`.red, proxyIP);
      }
    } catch (error) {
      this.log(`[Account ${index}] Error get quest: ${error.message}`.red, proxyIP);
    }
  }

  async submitQuestProgress(data, proxy, index, proxyIP, questType, questId) {
    const url = `${baseUrl}quest/${questType}/${questId}/progress`
    try {
      const res = await axios.post(url,{}, this.getAxiosConfig(proxy, index, data))
      if (res.status === 200) {
        return res.data.data
      }
    } catch (error) {
      this.log(`[Account ${index}] Error submit quest progress: ${error.message}`.red, proxyIP);
    }
  }

  async processQuest(data, proxy, index, proxyIP) {
    const questsResult = await this.getQuest(data, proxy, index, proxyIP)
    if (!questsResult) return

    const claimableQuests = questsResult?.filter(quest => quest.status === 'CLAIM');
    if (claimableQuests.length > 0) {
      this.log(`[Account ${index}] Claiming quest rewards...`.yellow, proxyIP)
      for (const quest of claimableQuests) {
        const submitResult = await this.submitQuestProgress(data, proxy, index, proxyIP, quest.questType, quest.id)
        if (submitResult?.status === 'DONE') {
          const rewards = submitResult.rewards.map(reward => {
            if (reward?.rewardType === 'WARBOND') {
                return `${reward?.rewardAmount} $War.Bond`;
            }
            return `${reward.rewardAmount} ${reward.rewardType}`;
          }).join(' + ');

          this.log(`[Account ${index}] Quest ${quest?.title} completed! Reward: ${rewards}`.green, proxyIP)
        } else {
          this.log(`[Account ${index}] Error completing quest ${quest?.title}!`.red, proxyIP)
        }
      }
    }
    

    const pendingQuests = questsResult?.filter(quest => quest.status === 'GO');
    if (pendingQuests.length === 0) {
      this.log(`[Account ${index}] No quest to complete!`.yellow, proxyIP)
      return
    }

    for (const quest of pendingQuests) {
      this.log(`[Account ${index}] Completing quest ${quest?.title}...`.blue, proxyIP)
      let submitResult = await this.submitQuestProgress(data, proxy, index, proxyIP, quest.questType, quest.id)
      if (submitResult?.status !== 'VERIFY' || !submitResult) {
        this.log(`[Account ${index}] Error completing quest ${quest?.title}!`.red, proxyIP)
        continue
      }

      await this.sleep(3000);

      submitResult = await this.submitQuestProgress(data, proxy, index, proxyIP, quest.questType, quest.id)
      if (submitResult?.status !== 'CLAIM' || !submitResult) {
        this.log(`[Account ${index}] Error completing quest ${quest?.title}!`.red, proxyIP)
        continue
      }

      await this.sleep(3000);

      submitResult = await this.submitQuestProgress(data, proxy, index, proxyIP, quest.questType, quest.id)
      if (submitResult?.status !== 'DONE' || !submitResult) {
        this.log(`[Account ${index}] Error completing quest ${quest?.title}!`.red, proxyIP)
        continue
      }

      const rewards = submitResult.rewards.map(reward => {
        if (reward?.rewardType === 'WARBOND') {
            return `${reward?.rewardAmount} $War.Bond`;
        }
        return `${reward.rewardAmount} ${reward.rewardType}`;
    }).join(' + ');

    this.log(`[Account ${index}] Quest ${quest?.title} completed! Reward: ${rewards}`.green, proxyIP)
    }
  }

  async checkPreOrder(data, proxy, index, proxyIP) {
    const url = `${baseUrl}user/my/preorder`
    try {
      const res = await axios.get(url, this.getAxiosConfig(proxy, index, data))
      if (res?.data.data) {
        return res.data.data
      }
    } catch (error) {
      this.log(`[Account ${index}] Error checking pre-order status: ${error.message}`.red, proxyIP)
    }
  }


  async process(data, proxy, index) {
    const proxyIP = proxy?.split("@")[1] || "local";
    const userInfo = await this.getUserInfo(data, proxy, index, proxyIP);
    await this.processCheckIn(data, proxy, index, proxyIP);
    await this.processTreasury(data, proxy, index, proxyIP);
    await this.processQuest(data, proxy, index, proxyIP);
    await this.processGuildOperations(data, proxy, index, proxyIP);
  }

  async main() {
    await this.title();
    const dataFile = path.join(process.cwd(), "data.txt");
    const data = fs
      .readFileSync(dataFile, "utf8")
      .replace(/\r/g, "")
      .split("\n")
      .filter(Boolean);

    const proxyFile = path.join(process.cwd(), "proxy.txt");
    const proxyList = fs
      .readFileSync(proxyFile, "utf8")
      .replace(/\r/g, "")
      .split("\n")
      .filter(Boolean);

    if (data.length <= 0) {
      this.log("No accounts added!".red);
      await this.sleep(5000);
      process.exit();
    }

    if (proxyList.length <= 0) {
      console.log("No proxies added, using local ip!".yellow);
    }

    while (true) {
      const threads = [];
      for (const [index, tgData] of data.entries()) {
        const proxy = proxyList[index % proxyList.length] || null;
        const telegramInitData = encodeURIComponent(encodeURI(decodeURIComponent(tgData)));
        threads.push(this.process(telegramInitData, proxy, index + 1));
        if (threads.length >= config.threads) {
          console.log(`Running ${threads.length} threads process...`.bgYellow);
          await Promise.all(threads);
          threads.length = 0;
        }
      }
      if (threads.length > 0) {
        console.log(`Running ${threads.length} threads process...`.bgYellow);
        await Promise.all(threads);
      }
      await this.waitWithCountdown(config.wait_time);
    }
  }
}

if (require.main === module) {
  process.on("SIGINT", () => {
    process.exit();
  });
  new MinersClub().main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
