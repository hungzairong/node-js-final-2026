const { dataSource } = require("../db/data-source");
const appError = require("../utils/appError");
const { isValidString, isInteger } = require("../utils/validUtils");

const creditPackageController = {
  async getAll(req, res, next) {
    const repo = dataSource.getRepository("CreditPackage");
    const packages = await repo.find({
      order: { created_at: "ASC" },
      select: { id: true, name: true, credit_amount: true, price: true },
    });
    res.json({ status: "success", data: packages });
  },

  async create(req, res, next) {
    const { name, credit_amount, price } = req.body;
    if (
      !isValidString(name) ||
      !isInteger(credit_amount) ||
      credit_amount < 0 ||
      !isInteger(price) ||
      price < 0
    ) {
      return next(appError(400, "欄位未填寫正確"));
    }
    const repo = dataSource.getRepository("CreditPackage");
    const existing = await repo.findOneBy({ name: name.trim() });
    if (existing) {
      return next(appError(409, "資料重複"));
    }
    const pkg = await repo.save({ name: name.trim(), credit_amount, price });
    res.json({
      status: "success",
      data: {
        id: pkg.id,
        name: pkg.name,
        credit_amount: pkg.credit_amount,
        price: pkg.price,
        createdAt: pkg.created_at,
      },
    });
  },

  async remove(req, res, next) {
    const repo = dataSource.getRepository("CreditPackage");
    const result = await repo.delete(req.params.creditPackageId);
    if (result.affected === 0) {
      return next(appError(400, "ID錯誤"));
    }
    res.json({ status: "success" });
  },
  // M5-1 購買堂數方案 需登入
  async purchase(req, res, next) {
    // 取得 post的creditPackageId
    const { creditPackageId } = req.params;
    // 取得資料庫CreditPackageTable的資料，id為creditPackageId的資料
    const repo = dataSource.getRepository("CreditPackage");
    const findPackage = await repo.findOneBy({ id: creditPackageId });
    // 如果找不到，則回傳400錯誤
    if (!findPackage) {
      return next(appError(400, "ID錯誤"));
    }
    // 取得資料庫CreditPurchaseTable的資料
    const purchaseRepo = dataSource.getRepository("CreditPurchase");
    // 將購買資料存入資料庫
    await purchaseRepo.save({
      user_id: req.user.id,
      credit_package_id: findPackage.id,
      purchased_credits: findPackage.credit_amount,
      price_paid: findPackage.price,
    });

    res.json({ status: "success", data: null });
  },
};

module.exports = creditPackageController;
