/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 * @typedef {import('typeorm').QueryRunner} QueryRunner
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
module.exports = class AddCreditPackageTable1794633672086 {
    name = 'AddCreditPackageTable1794633672086'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE IF NOT EXISTS "CREDIT_PACKAGE" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(50) NOT NULL, "credit_amount" integer NOT NULL, "price" integer NOT NULL, CONSTRAINT "UQ_credit_package_name" UNIQUE ("name"), CONSTRAINT "PK_credit_package_id" PRIMARY KEY ("id"))`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`DROP TABLE "CREDIT_PACKAGE"`);
    }
}
