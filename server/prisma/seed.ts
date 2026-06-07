import { PrismaClient, ExamCategory } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Postgraduate Exams (考研) ────────────

  const pgEntrance = await prisma.exam.upsert({
    where: { id: 'exam-postgrad-root' },
    update: {},
    create: {
      id: 'exam-postgrad-root',
      category: 'POSTGRADUATE' as ExamCategory,
      name: '全国硕士研究生招生考试',
      nameEn: 'National Postgraduate Entrance Exam',
      sortOrder: 1,
    },
  });

  const pgSubjects = [
    { id: 'pg-cs', name: '计算机科学与技术', nameEn: 'Computer Science' },
    { id: 'pg-finance', name: '金融学', nameEn: 'Finance' },
    { id: 'pg-law', name: '法律硕士', nameEn: 'Juris Master (JM)' },
    { id: 'pg-mba', name: 'MBA / EMBA', nameEn: 'MBA / EMBA' },
    { id: 'pg-mpa', name: '公共管理硕士 (MPA)', nameEn: 'Master of Public Administration' },
    { id: 'pg-med', name: '临床医学', nameEn: 'Clinical Medicine' },
    { id: 'pg-edu', name: '教育硕士', nameEn: 'Master of Education' },
    { id: 'pg-eng', name: '电子/通信工程', nameEn: 'Electronics & Telecom Engineering' },
    { id: 'pg-acc', name: '会计硕士 (MPAcc)', nameEn: 'Master of Professional Accounting' },
    { id: 'pg-psych', name: '心理学', nameEn: 'Psychology' },
  ];

  for (const s of pgSubjects) {
    await prisma.exam.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, parentId: pgEntrance.id, category: 'POSTGRADUATE' as ExamCategory },
    });
  }

  // ─── Certificate Exams (证书) ─────────────

  const certRoot = await prisma.exam.upsert({
    where: { id: 'exam-cert-root' },
    update: {},
    create: {
      id: 'exam-cert-root',
      category: 'CERTIFICATE' as ExamCategory,
      name: '职业证书考试',
      nameEn: 'Professional Certificate Exams',
      sortOrder: 2,
    },
  });

  const certificates = [
    { id: 'cert-cpa', name: '注册会计师 (CPA)', nameEn: 'CPA' },
    { id: 'cert-cfa', name: '特许金融分析师 (CFA)', nameEn: 'CFA' },
    { id: 'cert-frm', name: '金融风险管理师 (FRM)', nameEn: 'FRM' },
    { id: 'cert-acca', name: 'ACCA 国际注册会计师', nameEn: 'ACCA' },
    { id: 'cert-bar', name: '法律职业资格考试 (法考)', nameEn: 'Bar Exam' },
    { id: 'cert-doctor', name: '执业医师资格证', nameEn: 'Medical License' },
    { id: 'cert-architect', name: '一级建造师', nameEn: 'Class 1 Architect' },
    { id: 'cert-pmp', name: 'PMP 项目管理', nameEn: 'PMP' },
    { id: 'cert-teacher', name: '教师资格证', nameEn: 'Teaching Certificate' },
    { id: 'cert-cs', name: '计算机技术与软件', nameEn: 'Computer Tech Qualification' },
  ];

  for (const c of certificates) {
    await prisma.exam.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, parentId: certRoot.id, category: 'CERTIFICATE' as ExamCategory },
    });
  }

  // ─── Proficiency Exams (等级考试) ──────────

  const profRoot = await prisma.exam.upsert({
    where: { id: 'exam-prof-root' },
    update: {},
    create: {
      id: 'exam-prof-root',
      category: 'PROFICIENCY' as ExamCategory,
      name: '语言及等级考试',
      nameEn: 'Language & Proficiency Exams',
      sortOrder: 3,
    },
  });

  const proficiencies = [
    { id: 'prof-cet4', name: '大学英语四级 (CET-4)', nameEn: 'CET-4' },
    { id: 'prof-cet6', name: '大学英语六级 (CET-6)', nameEn: 'CET-6' },
    { id: 'prof-ielts', name: '雅思 (IELTS)', nameEn: 'IELTS' },
    { id: 'prof-toefl', name: '托福 (TOEFL)', nameEn: 'TOEFL' },
    { id: 'prof-gre', name: 'GRE', nameEn: 'GRE' },
    { id: 'prof-jlpt', name: '日语能力考试 (JLPT)', nameEn: 'JLPT' },
    { id: 'prof-topik', name: '韩语能力考试 (TOPIK)', nameEn: 'TOPIK' },
    { id: 'prof-dele', name: '西班牙语 DELE', nameEn: 'DELE' },
    { id: 'prof-delf', name: '法语 DELF/DALF', nameEn: 'DELF/DALF' },
    { id: 'prof-gov', name: '公务员考试', nameEn: 'Civil Service Exam' },
    { id: 'prof-ncre', name: '全国计算机等级考试', nameEn: 'NCRE' },
    { id: 'prof-hsk', name: '汉语水平考试 (HSK)', nameEn: 'HSK' },
  ];

  for (const p of proficiencies) {
    await prisma.exam.upsert({
      where: { id: p.id },
      update: {},
      create: { ...p, parentId: profRoot.id, category: 'PROFICIENCY' as ExamCategory },
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
