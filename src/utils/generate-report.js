import { execSync } from "child_process";
import fs from "fs";

// Get current date and time
const date = new Date();
const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1)
  .toString()
  .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}_${date
  .getHours()
  .toString()
  .padStart(2, "0")}-${date.getMinutes().toString().padStart(2, "0")}`;
const creationDate = `${date.getFullYear()}-${(date.getMonth() + 1)
  .toString()


  
  .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;

// Define output folder
const outputDir = `paid-qa-report/${creationDate}/paid-report-${timestamp}`;

// Generate the report
try {
  console.log("Generating Allure report...");
  execSync(`allure generate allure-results --clean -o ${outputDir}`);
  console.log(`Allure report generated at: ${outputDir}`);

  // Open the report
  execSync(`allure open ${outputDir}`);
} catch (error) {
  console.error("Error generating Allure report:", error);
}
