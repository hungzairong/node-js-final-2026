const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isValidPassword } = require("../utils/validUtils");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");

const PWD_ERR = "密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字";

const usersController = {
  async signup(req, res, next) {
    const { name, email, password } = req.body;
    if (
      !isValidString(name) ||
      !isValidString(email) ||
      !isValidString(password)
    ) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    if (!isValidPassword(password)) {
      next(appError(400, PWD_ERR));
      return;
    }

    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });

    if (findUser) {
      next(appError(409, "Email 已被使用"));
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await userRepo.save({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: "USER",
      password: hashed,
    });

    res.status(201).json({
      status: "success",
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
        },
      },
    });
    return;
  },

  async login(req, res, next) {
    const { email, password } = req.body;
    if (!isValidString(email) || !isValidString(password)) {
      next(appError(400, "欄位未填寫正確"));
      return;
    }

    if (!isValidPassword(password)) {
      next(appError(400, PWD_ERR));
      return;
    }
    // 帳號不存在「或」密碼比對錯誤（⚠️ 兩種情況共用同一句）：
    // 「使用者不存在或密碼輸入錯誤」
    const userRepo = dataSource.getRepository("User");
    const findUser = await userRepo.findOneBy({
      email: email.trim().toLowerCase(),
    });

    if (!findUser) {
      // 不是偷懶 直接用一個嗎
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }

    const isMatch = await bcrypt.compare(password, findUser.password);
    if (!isMatch) {
      next(appError(400, "使用者不存在或密碼輸入錯誤"));
      return;
    }

    const token = await jwt.sign(
      {
        id: findUser.id,
        role: findUser.role,
      },
      config.get("secret.jwtSecret"),
      {
        expiresIn: config.get("secret.jwtExpires"),
      },
    );

    res.status(201).json({
      status: "success",
      data: {
        token,
        user: {
          name: findUser.name,
        },
      },
    });
    return;
  },

  async getProfile(req, res, next) {
    // req.user
    res.json({
      status: "success",
      data: {
        user: {
          name: req.user.name,
          email: req.user.email,
        },
      },
    });
    return;
  },
  async putProfile(req, res, next) {
    const { name } = req.body;

    // 1. 驗證欄位：name 缺漏或為空字串
    if (!isValidString(name)) {
      return next(appError(400, "欄位未填寫正確"));
    }

    // 2. 驗證名稱是否與目前相同 (req.user 來自 isAuth middleware)
    if (name.trim() === req.user.name) {
      return next(appError(400, "使用者名稱未變更"));
    }

    try {
      const userRepo = dataSource.getRepository("User");

      // 3. 更新資料庫中的使用者暱稱
      req.user.name = name.trim();
      await userRepo.save(req.user);

      // 4. 回傳成功結果 (狀態碼 200，格式與 Swagger 完全一致)
      res.status(200).json({
        status: "success",
        data: { user: { name: req.user.name }
        }
      });
    } catch (error) {
      // 5. 極少見的邊角情況錯誤處理
      return next(appError(400, "更新使用者資料失敗"));
    }
  },

  async putPassword(req, res, next) {
    const { password, new_password, confirm_new_password } = req.body;

    // 1. 三欄位任一缺漏或為空字串 -> 「欄位未填寫正確」
    if (
      !isValidString(password) ||
      !isValidString(new_password) ||
      !isValidString(confirm_new_password)
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }

    // 2. 三欄位任一不符密碼規則 -> 「密碼不符合規則，需要包含英文數字大小寫，最短8個字，最長16個字」
    if (
      !isValidPassword(password) ||
      !isValidPassword(new_password) ||
      !isValidPassword(confirm_new_password)
    ) {
      return next(appError(400, PWD_ERR));
    }

    // 3. 新密碼與舊密碼相同 -> 「新密碼不能與舊密碼相同」
    if (new_password === password) {
      return next(appError(400, "新密碼不能與舊密碼相同"));
    }

    // 4. 新密碼與確認新密碼不一致 -> 「新密碼與驗證新密碼不一致」
    if (new_password !== confirm_new_password) {
      return next(appError(400, "新密碼與驗證新密碼不一致"));
    }

    // 5. 舊密碼比對錯誤 -> 「密碼輸入錯誤」
    // (req.user 來自前面的 isAuth middleware，已含有資料庫內加密的舊密碼)
    const match = await bcrypt.compare(password, req.user.password);
    if (!match) {
      return next(appError(400, "密碼輸入錯誤"));
    }

    try {
      const userRepo = dataSource.getRepository("User");

      // 6. 將新密碼加密並儲存
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      req.user.password = hashedNewPassword;
      await userRepo.save(req.user);

      // 7. 成功回傳，狀態碼 200，data 為 null
      res.status(200).json({
        status: "success",
        data: null
      });
    } catch (error) {
      return next(appError(500, "修改密碼失敗"));
    }
  },

  // M5-2 取得本人購買的方案紀錄
  async getCreditPackage(req, res, next) {
    // 先取得資料庫CreditPurchaseTable的資料
    const purchaseRepo = dataSource.getRepository("CreditPurchase");
    // 取得購買者id為req.user.id的CreditPurchaseTable的資料
    const purchases = await purchaseRepo.find({
      where: { user_id: req.user.id },
      relations: { creditPackage: true },
      order: { purchase_at: "DESC" },
    });
    // 將購買資料轉換為JSON格式 ,
    // 原先為[{id: string, user_id: string, credit_package_id: string, purchased_credits: number, price_paid: number, purchase_at: string}]格式，
    // 現在為[{name: string, purchased_credits: number, price_paid: number, purchase_at: string}]格式
    const data = purchases.map((p) => ({
      name: p.creditPackage.name,
      purchased_credits: p.purchased_credits,
      price_paid: p.price_paid,
      purchase_at: p.purchase_at,
    }));
    res.json({ status: "success", data });
  },

  // M5-3 取得本人的課表與剩餘堂數 需登入
  async getCourses(req, res, next) {
    
    // 先取得資料庫CreditPurchaseTable的資料  --> 為了取得購買者總堂數
    const purchaseRepo = dataSource.getRepository("CreditPurchase");
   
    // 取得購買者id為req.user.id的CreditPurchaseTable的資料
    const purchases = await purchaseRepo.find({
      where: { user_id: req.user.id },
    });
    // 計算購買者總堂數
    const totalCredits = purchases.reduce(
      (sum, p) => sum + p.purchased_credits,
      0,
    );



    // 取得資料庫CourseBookingTable的資料  
    // --> 為了取得購買者課表(已報名課程)--->然後用filter算出來未取消的堂數
    const bookingRepo = dataSource.getRepository("CourseBooking");
    // 取得購買者id為req.user.id的CourseBookingTable的資料
    const allBookings = await bookingRepo.find({
      where: { user_id: req.user.id },
      relations: { course: { user: true } },
      order: { course: { start_at: "ASC" } },
    });


    // 計算購買者使用堂數 --> 篩選出cancelled_at不為null的堂數
    const creditUsage = allBookings.filter((b) => !b.cancelled_at).length;
    // 計算購買者剩餘堂數
    const creditRemain = totalCredits - creditUsage;

    // 將課表資料轉換為JSON格式
    const courseBooking = allBookings.map((b) => ({
      course_id: b.course_id,
      name: b.course.name,
      start_at: b.course.start_at,
      end_at: b.course.end_at,
      meeting_url: b.course.meeting_url,
      coach_name: b.course.user.name,
      cancelled_at: b.cancelled_at,
    }));

    // 將課表資料轉換為JSON格式
    res.json({
      status: "success",
      data: {
        credit_remain: creditRemain,   // 剩餘堂數
        credit_usage: creditUsage,     // 使用堂數
        course_booking: courseBooking, // 課表資料
      },
    });
  },
};

module.exports = usersController;
