import { expect } from "@playwright/test";

export async function VerifyConfirmationMessage(
  page,
  validationToster,
  expectedMessage
) {
  const actualMessage = await page.locator(validationToster).textContent();

  if (actualMessage === expectedMessage) {
    console.log("Validation message displaying successfully");
    expect(actualMessage).toBeTruthy();
  } else {
    console.log("Validation message is not displaying successfully");
    expect(actualMessage).toBeFalsy();
  }
};
