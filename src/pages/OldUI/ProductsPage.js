import { GenerateRandomNumbers } from "../../utils/GenerateRandomNumbers";
import { generateRandomString } from "../../utils/GenerateRandomString";
import { VerifyConfirmationMessage } from "../../utils/VerifyConfirmationMessage";


export class ProductsPage {
  constructor(page) {
    this.page = page;
    this.productsSideLink =
      "//h6/div/div/p[normalize-space()='Products & Services']";
    this.addProductBtn = "//span[normalize-space()='Add Product']";
    this.productName = "//input[@name='name']";
    this.productImage = "//input[@type='file']";
    this.productDesc = "//textarea[@name='description']";
    this.productPrice = "//input[@name='priceItem[0].price']";
    this.saveBtn = "//span[normalize-space()='Save']";
    this.validationToster = "//div[@id='notistack-snackbar']";
  }

  async addProducts() {
    await this.page.click(this.productsSideLink);
    await this.page.click(this.addProductBtn);
    await this.page.fill(this.productName, generateRandomString(6));
    await this.page.fill(
      this.productDesc,
      generateRandomString(6) + "" + generateRandomString(9)
    );

    //To upload product image
    await this.page
      .locator(this.productImage)
      .setInputFiles("src/Images/product1.jpg");

    //To enter Product price
    await this.page.fill(
      this.productPrice,
      GenerateRandomNumbers(2) + "." + GenerateRandomNumbers(2)
    );

    await this.page.click(this.saveBtn);
    await this.page.waitForTimeout(2000);

    // To verify tha validation message displaying or
    await VerifyConfirmationMessage(
      this.page,
      this.validationToster,
      "Product added successfully!"
    );
  }
};
