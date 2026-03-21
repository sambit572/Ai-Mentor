import { sequelize, connectDB } from "../config/db.js";
import Course from "../models/Course.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const migrateCourses = async () => {
  // 1. Connect to PostgreSQL
  await connectDB();

  // 2. Sync the Course table (creates it if it doesn't exist)
  await Course.sync({ alter: true });
  console.log("✅ Course table synced.");

  // 3. Read JSON files
  const coursesPath = path.join(
    __dirname,
    "../../frontend/public/data/courses.json"
  );
  const previewsPath = path.join(
    __dirname,
    "../../frontend/public/data/coursePreviews.json"
  );

  const coursesData = JSON.parse(fs.readFileSync(coursesPath, "utf8"));
  const previewsData = JSON.parse(fs.readFileSync(previewsPath, "utf8"));

  console.log(`📦 Found ${coursesData.popularCourses.length} courses to migrate...`);

  // 4. Upsert each course (insert or update if already exists)
  let created = 0;
  let updated = 0;

  for (const preview of previewsData.courses) {
    const info = coursesData.popularCourses.find((c) => c.id === preview.id);

    const coursePayload = {
      id: preview.id,
      title: info?.title || preview.title,
      category: info?.category || preview.category || "General",
      level: info?.level || preview.level || "Beginner",
      lessons: info?.lessons || preview.lessons || "0 lessons",
      price: Number(info?.priceValue ?? preview.price?.current ?? 0),
      rating: preview.rating,
      students: info?.students || String(preview.students),
      image: info?.image || preview.thumbnail,
      categoryColor: info?.categoryColor || "bg-blue-100 text-blue-600",
    };

    const [, wasCreated] = await Course.upsert(coursePayload);
    if (wasCreated) {
      created++;
    } else {
      updated++;
    }

    console.log(`  ✔ [${coursePayload.id}] ${coursePayload.title} (${coursePayload.category})`);
  }

  console.log(`\n🎉 Migration complete!`);
  console.log(`   Created: ${created} | Updated: ${updated}`);
  process.exit(0);
};

migrateCourses().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});