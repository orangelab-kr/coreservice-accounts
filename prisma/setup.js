/* eslint-disable @typescript-eslint/no-var-requires */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
async function main() {
  const { name } = await getDefaultLevel();
  console.log(`기본 레벨 이름: ${name}`);
  console.log('모든 준비가 완료되었습니다.');
  process.exit(0);
}

async function getDefaultLevel() {
  let defaultLevel = await prisma.levelModel.findFirst();
  if (!defaultLevel) {
    console.log('- 기본 레벨이 없습니다. 새로 생성합니다.');
    defaultLevel = await prisma.levelModel.create({
      data: {
        levelNo: 0,
        name: '그린',
        color: '#32CD32',
        requiredPoint: 0,
      },
    });
  }

  return defaultLevel;
}

main();
