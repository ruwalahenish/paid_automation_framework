/**
 * Helper class for common element interactions in Playwright tests
 */
export class ElementHelper {
  constructor(page, logger) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Wait for an element to be visible and return it
   * @param {string} selector - Element selector
   * @param {string} description - Description for error message
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<ElementHandle>} - Playwright element handle
   */
  async waitForElement(selector, description, timeout = 60000) {
    try {
      // Try both CSS and XPath selectors
      let element;
      if (selector.startsWith("//") || selector.startsWith("(//")) {
        element = this.page.locator(selector);
      } else {
        // For CSS selectors, also wait for them to be attached to DOM
        element = this.page.locator(selector);
        await this.page.waitForSelector(selector, {
          state: "attached",
          timeout,
        });
      }

      await element.waitFor({ state: "visible", timeout });
      return element;
    } catch (error) {
      const errorMessage = `${description} not found after ${
        timeout / 1000
      } seconds. Error: ${error.message}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Fill an input field after waiting for it
   * @param {string} selector - Element selector
   * @param {string} value - Value to fill
   * @param {string} description - Description for error message
   * @returns {Promise<void>}
   */
  async fillInput(selector, value, description) {
    const element = await this.waitForElement(selector, description);
    await element.fill(value);
  }

  /**
   * Click an element after waiting for it
   * @param {string} selector - Element selector
   * @param {string} description - Description for error message
   * @returns {Promise<void>}
   */
  async clickElement(selector, description) {
    const element = await this.waitForElement(selector, description);
    await element.click();
  }

  /**
   * Check if element is checked/selected
   * @param {string} selector - Element selector
   * @param {string} description - Description for error message
   * @returns {Promise<boolean>}
   */
  async isChecked(selector, description) {
    const element = await this.waitForElement(selector, description);
    return await element.isChecked();
  }

  /**
   * Check if element is visible
   * @param {string} selector - Element selector
   * @param {string} description - Description for error message
   * @returns {Promise<boolean>}
   */
  async isVisible(selector, description) {
    try {
      const element = await this.page.locator(selector);
      return await element.isVisible();
    } catch (error) {
      const errorMessage = `${description} not found after 60 seconds. Error: ${error.message}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  /**
   * Upload file to an input
   * @param {string} selector - Element selector
   * @param {string} filePath - Path to file
   * @param {string} description - Description for error message
   * @returns {Promise<void>}
   */
  async uploadFile(selector, filePath, description) {
    try {
      // For file inputs, we use page.locator directly as it's more reliable for file uploads
      const fileInput = this.page.locator(selector);
      await fileInput.waitFor({ state: "attached", timeout: 60000 });
      await fileInput.setInputFiles(filePath);
    } catch (error) {
      const errorMessage = `Failed to upload file to ${description}. Error: ${error.message}`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }
}
