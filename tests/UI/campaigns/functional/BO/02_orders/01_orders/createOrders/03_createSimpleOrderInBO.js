require('module-alias/register');

// Helpers to open and close browser
const helper = require('@utils/helpers');

// Import BO pages
const dashboardPage = require('@pages/BO/dashboard');
const ordersPage = require('@pages/BO/orders');
const addOrderPage = require('@pages/BO/orders/add');
const orderPageProductsBlock = require('@pages/BO/orders/view/productsBlock');
const orderPageCustomerBlock = require('@pages/BO/orders/view/customerBlock');
const cartRulesPage = require('@pages/BO/catalog/discounts');

// Import login steps
const loginCommon = require('@commonTests/loginBO');

// Import data
// Customer
const {DefaultCustomer} = require('@data/demo/customer');

// Products
const {Products} = require('@data/demo/products');

// Order status
const {Statuses} = require('@data/demo/orderStatuses');

// Carriers
const {Carriers} = require('@data/demo/carriers');

// Addresses
const addresses = require('@data/demo/address');

// Order to make data
const orderToMake = {
  customer: DefaultCustomer,
  products: [
    {value: Products.demo_5, quantity: 4},
  ],
  deliveryAddress: 'Mon adresse',
  invoiceAddress: 'Mon adresse',
  addressValue: addresses.second,
  deliveryOption: {
    name: `${Carriers.default.name} - ${Carriers.default.delay}`,
    freeShipping: true,
  },
  paymentMethod: 'Payments by check',
  orderStatus: Statuses.paymentAccepted,
  totalPrice: (Products.demo_5.price * 4) * 1.2, // Price tax included
};

// Import test context
const testContext = require('@utils/testContext');

const baseContext = 'functional_BO_orders_orders_createOrders_createSimpleOrderInBO';

// Import expect from chai
const {expect} = require('chai');

let browserContext;
let page;
let numberOfCartRules = 0;

/*
Go to create order page
Search and choose a customer
Add products to cart
Choose addresses for delivery and invoice
Choose payment status
Set order status and save the order
From view order page check these details :
- Order status
- Total price
- Shipping address
- Invoice address
- Products names
 */
describe('BO - Orders - Create order : Create simple order in BO', async () => {
  before(async function () {
    browserContext = await helper.createBrowserContext(this.browser);
    page = await helper.newTab(browserContext);
  });

  after(async () => {
    await helper.closeBrowserContext(browserContext);
  });

  it('should login in BO', async function () {
    await loginCommon.loginBO(this, page);
  });

  it('should go to \'Orders > Orders\' page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToOrdersPage', baseContext);

    await dashboardPage.goToSubMenu(
      page,
      dashboardPage.ordersParentLink,
      dashboardPage.ordersLink,
    );

    await ordersPage.closeSfToolBar(page);

    const pageTitle = await ordersPage.getPageTitle(page);
    await expect(pageTitle).to.contains(ordersPage.pageTitle);
  });

  it('should go to create order page', async function () {
    await testContext.addContextItem(this, 'testIdentifier', 'goToCreateOrderPage', baseContext);

    await ordersPage.goToCreateOrderPage(page);
    const pageTitle = await addOrderPage.getPageTitle(page);
    await expect(pageTitle).to.contains(addOrderPage.pageTitle);
  });

  describe('Create order and check result', async () => {
    it('should create the order', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'createOrder', baseContext);

      await addOrderPage.createOrder(page, orderToMake);
      const pageTitle = await orderPageProductsBlock.getPageTitle(page);
      await expect(pageTitle).to.contain(orderPageProductsBlock.pageTitle);
    });

    it('should check order status', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkOrderStatus', baseContext);

      const orderStatus = await orderPageProductsBlock.getOrderStatus(page);
      await expect(orderStatus).to.equal(orderToMake.orderStatus.status);
    });

    it('should check order total price', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkOrderPrice', baseContext);

      const totalPrice = await orderPageProductsBlock.getOrderTotalPrice(page);
      await expect(totalPrice).to.equal(orderToMake.totalPrice);
    });

    it('should check order shipping address', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkShippingAddress', baseContext);

      const shippingAddress = await orderPageCustomerBlock.getShippingAddress(page);
      await expect(shippingAddress)
        .to.contain(orderToMake.addressValue.firstName)
        .and.to.contain(orderToMake.addressValue.lastName)
        .and.to.contain(orderToMake.addressValue.address)
        .and.to.contain(orderToMake.addressValue.zipCode)
        .and.to.contain(orderToMake.addressValue.city)
        .and.to.contain(orderToMake.addressValue.country);
    });

    it('should check order invoice address', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkInvoiceAddress', baseContext);

      const invoiceAddress = await orderPageCustomerBlock.getInvoiceAddress(page);
      await expect(invoiceAddress)
        .to.contain(orderToMake.addressValue.firstName)
        .and.to.contain(orderToMake.addressValue.lastName)
        .and.to.contain(orderToMake.addressValue.address)
        .and.to.contain(orderToMake.addressValue.zipCode)
        .and.to.contain(orderToMake.addressValue.city)
        .and.to.contain(orderToMake.addressValue.country);
    });

    it('should check products names in cart list', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'checkProductsNames', baseContext);

      for (let i = 1; i <= orderToMake.products.length; i++) {
        const productName = await orderPageProductsBlock.getProductNameFromTable(page, i);
        await expect(productName).to.contain(orderToMake.products[i - 1].value.name);
      }
    });
  });

  // Post-Condition - Bulk delete cart rules
  describe('POST-TEST: Delete cart rule', async () => {
    it('should go to \'Catalog > Discounts\' page', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'goToDiscountsPage3', baseContext);

      await dashboardPage.goToSubMenu(
        page,
        dashboardPage.catalogParentLink,
        dashboardPage.discountsLink,
      );

      const pageTitle = await cartRulesPage.getPageTitle(page);
      await expect(pageTitle).to.contains(cartRulesPage.pageTitle);
    });

    it('should reset and get number of cart rules', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetFirst', baseContext);

      numberOfCartRules = await cartRulesPage.resetAndGetNumberOfLines(page);
      await expect(numberOfCartRules).to.be.at.least(0);
    });

    it('should delete cart rule', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'deleteCartRule', baseContext);

      const validationMessage = await cartRulesPage.deleteCartRule(page);
      await expect(validationMessage).to.contains(cartRulesPage.successfulDeleteMessage);
    });

    it('should reset all filters', async function () {
      await testContext.addContextItem(this, 'testIdentifier', 'resetAfterBulkDelete', baseContext);

      const numberOfCartRulesAfterDelete = await cartRulesPage.resetAndGetNumberOfLines(page);
      await expect(numberOfCartRulesAfterDelete).to.equal(numberOfCartRules - 1);
    });
  });
});
