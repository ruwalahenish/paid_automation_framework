import { expect, test } from "@playwright/test";
import { createTestLogger } from "../../logging/logger";
import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers";
import { generateRandomString } from "../../utils/GenerateRandomString";
import { ElementHelper } from "../../utils/ElementHelper";

export class ProductServicePage {
  constructor(page) {
    this.page = page;
    this.logger = createTestLogger(test.info().file);
    this.elementHelper = new ElementHelper(page, this.logger);

    // Locators
    this.locators = {
      manageSidebarOption: "//button[@aria-label='Manage']",
      productServiceSidebarOption: "(//button[contains(.,'Products/Services')])[2]",
      addProductBtn: "//button[.='+ Add Product']",
      productNameInput: "//input[@id='name']",
      productDescriptionInput: "//textarea[@id='description']",
      productImage: "//input[@type='file']",
      productPriceInput: "//input[@id='price']",
      manageInventoryToggleInput: "//input[@name='manageInventory']",
      quantityInput: "//input[@id='quantity']",
      addProductSubmitBtn: "//button[.='Add Service or Product']",
      validationToaster: "//button/div/p[.='Product Added Successfully']",
    };
  }

  async navigateToProduct() {
    try {
      const { manageSidebarOption, productServiceSidebarOption } =
        this.locators;

      // Navigate to product/service section
      await this.elementHelper.clickElement(
        manageSidebarOption,
        "Manage sidebar option"
      );
      await this.elementHelper.clickElement(
        productServiceSidebarOption,
        "Product/Service option"
      );
    } catch (error) {
      this.logger.error(
        "Error navigating to the Product/Service module:",
        error.message
      );
      throw error;
    }
  }

  async addProduct() {
    try {
      const {
        addProductBtn,
        productImage,
        productNameInput,
        productDescriptionInput,
        productPriceInput,
        manageInventoryToggleInput,
        quantityInput,
        addProductSubmitBtn,
      } = this.locators;

      // Click add product button
      await this.elementHelper.clickElement(
        addProductBtn,
        "Add Product button"
      );

      await this.elementHelper.uploadFile(
        productImage,
        "src/Images/product1.jpg",
        "Product image input"
      );

      // Fill product details
      const productName = generateRandomString(5);
      await this.elementHelper.fillInput(
        productNameInput,
        productName,
        "Product name input"
      );

      const productDescription = `${generateRandomString(
        5
      )} ${generateRandomString(10)}`;
      await this.elementHelper.fillInput(
        productDescriptionInput,
        productDescription,
        "Product description input"
      );

      const productPrice = `${GenerateRandomNumbers(2)}.${GenerateRandomNumbers(
        2
      )}`;
      await this.elementHelper.fillInput(
        productPriceInput,
        productPrice,
        "Product price input"
      );

      // Handle inventory toggle
      const isChecked = await this.elementHelper.isChecked(
        manageInventoryToggleInput,
        "Manage inventory toggle"
      );
      if (!isChecked) {
        await this.elementHelper.clickElement(
          manageInventoryToggleInput,
          "Manage inventory toggle"
        );
      }
      this.logger.info("Manage inventory toggle is active");

      // Fill quantity
      const quantity = GenerateRandomNumbers(2);
      await this.elementHelper.fillInput(
        quantityInput,
        quantity,
        "Quantity input"
      );

      // Submit form
      await this.elementHelper.clickElement(
        addProductSubmitBtn,
        "Add Product submit button"
      );
    } catch (error) {
      this.logger.error("Error adding the Product/Service:", error.message);
      throw error;
    }
  }
}
