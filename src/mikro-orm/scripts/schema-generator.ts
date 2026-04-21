import { MikroORM } from '@mikro-orm/core';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { InquiryEntity } from '../entities/inquiry/inquiry-entity';
import { DB_NAME } from '../const';

async function main() {
  const orm = await MikroORM.init({
    dbName: DB_NAME,
    driver: SqliteDriver,
    entities: [InquiryEntity],
  });
  try {
    const generator = orm.getSchemaGenerator();
    const dropDump = await generator.getDropSchemaSQL();
    console.log(dropDump);
    const createDump = await generator.getCreateSchemaSQL();
    console.log(createDump);
    await generator.dropSchema();
    await generator.createSchema();
  } finally {
    await orm.close(true);
  }
}

main();
