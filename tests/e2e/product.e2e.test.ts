import { IProduct } from '@v1/types';
import request from 'supertest';
import { connectDB, clearDB, disconnectDB } from '@e2e/utils/setup';
import app from '@src/app';
import { newValidProductData, validUpdateProductData } from '@e2e/__fixtures__/productData';



beforeAll(async () => {
  await connectDB();
}, 10000);

afterEach( async () => {
})

afterAll( async () => {
  await clearDB()
  await disconnectDB()
})


describe('Product E2E test', () => {
  
  let productId: string;  
  let currentSlug: string;
  let slugList: string[] = [];
  let currentProduct: IProduct;

  /* test 01
    - /create
    - /read/:slug
    - /update/:slug
    - /delete/:slug
  */
  describe('test with valid Input', () => {
  
  it('should create a new product', async () => {
    const res = await request(app)
    .post('/api/v1/product/create')
    .send(newValidProductData)

    /*
      - checking if _id, title, price and slug is generated
      - checking if return product is the product that user requested to create
    */
    expect(res.status).toBe(201); 
    expect(res.body.product).toHaveProperty('_id')
    expect(res.body.product).toHaveProperty('title', newValidProductData.title)
    expect(res.body.product).toHaveProperty('price', newValidProductData.price)
    expect(res.body.product).toHaveProperty('slug')

    productId = res.body.product._id  // save for further test
    currentProduct = res.body.product //save for further test
    currentSlug = res.body.product.slug // save for further test
    slugList.push(res.body.product.slug) //save for further test
  })

  it('should update product', async () => {
    console.log(currentSlug)
    const res = await request(app)
      .put(`/api/v1/product/update/${currentSlug}`)
      .send(validUpdateProductData)

    /*
      - checking if return product is the same that was requested
      - checking if title and price is updated
      - checking if slug was auto updated
    */
    expect(res.status).toBe(200)
    expect(res.body.product).toHaveProperty('_id', productId)
    expect(res.body.product).toHaveProperty('title', validUpdateProductData.title)
    expect(res.body.product).toHaveProperty('slug', expect.not.stringMatching(currentSlug))
    expect(res.body.product).toHaveProperty('price', validUpdateProductData.price)

    currentProduct = res.body.product
    currentSlug = res.body.product.slug

  })

  it('should read currentProduct with currentSlug', async () => {
    const res = await request(app)
      .get(`/api/v1/product/read/${currentSlug}`)

    expect(res.status).toBe(200)
    expect(res.body.product).toMatchObject(currentProduct)
  })

  it('should read product with oldSlug', async () => {

    // till here we have only 1 old slug generate some more
    for ( let i = 0; i <= 5; i++ ) {
    
      const res = await request(app)
        .put(`/api/v1/product/update/${currentSlug}`)
        .send({
          title: `Updated title no ${i}`,
          price: i * 400 + 1
        })
          

      expect(res.status).toBe(200)
      expect(res.body.product).toHaveProperty('title', `Updated title no ${i}`)
      expect(res.body.product).toHaveProperty('price', i * 400 + 1)
      expect(res.body.product).toHaveProperty('slug', expect.not.stringMatching(currentSlug))

      //save current slug and update currentSlug to the new one and save currentProduct as latest prodcut to match
      slugList.push(currentSlug)
      currentSlug = res.body.product.slug
      currentProduct = res.body.product

    }

    // now try with these slug and check that do you get the latest product
    for (let slug of slugList) {

      const res = await request(app)
        .get(`/api/v1/product/read/${slug}`)

      expect(res.status).toBe(200)
      expect(res.body.product).toHaveProperty('_id', productId)
      expect(res.body.product).toHaveProperty('slug', currentSlug)
      expect(res.body.product).toHaveProperty('title', currentProduct.title)
      expect(res.body.product).toHaveProperty('price', currentProduct.price)
    }
  }, 10000)

  it('should delete product with currentSlug', async () => {
    //delete phase
    {
      const res = await request(app)
        .delete(`/api/v1/product/delete/${currentSlug}`)
        
      expect(res.status).toBe(200)
      expect(res.body.product).toHaveProperty('_id', productId)
      expect(res.body.product).toHaveProperty('slug', currentSlug)
      expect(res.body.product).toHaveProperty('title', currentProduct.title)
    }
    //check if delete was successfull
    {
      const res = await request(app)
        .get(`/api/v1/product/read/${currentSlug}`)

      expect(res.status).toBe(404)
    }

  })


 })
 //! depend on test 01, don't change sequence
 describe('test with invalid Input', () => {

  it('should not let update with the oldSlug', async () => {
    // update test
    
    for (let slug of slugList) {
      
      const res = await request(app)
        .put(`/api/v1/product/update/${slug}`)
        .send({ price : Math.floor(Math.random()) * 400 + 1})

      expect(res.status).toBe(404)

    }

    
  },10000)

  it('should not delete with oldSlug', async () => {
    
    for (let slug of slugList) {
      const res = await request(app)
        .delete(`/api/v1/product/delete/${slug}`)

      expect(res.status).toBe(404)
    }

  },10000)

 })

 /*test
  - /read
 */
 describe('test read route', () => {
  const slugList : string[] = []

    it('should read all createdProduct', async () => {
      await clearDB();
      //create product
      const productCount = 10
      for (let i = 0; i < productCount; i++) {
        const res = await request(app)
          .post('/api/v1/product/create')
          .send({
            title: `Test Product No ${i + 1}`,
            price: (i + 1) * 400
          })
        
        expect(res.status).toBe(201)
        slugList.push(res.body.product.slug)
      }
     
      const res = await request(app)
        .get('/api/v1/product/read')

      expect(res.status).toBe(200)
      expect(res.body.products).toBeInstanceOf(Array)
      expect(res.body.products).toHaveLength(productCount)
      res.body.products.forEach((product: IProduct )=> {
        expect(product).toHaveProperty('_id')
        expect(product).toHaveProperty('slug')
        expect(product).toHaveProperty('title')
      });
    
    }, 10000)

    it('when no product in system', async () => {
      for (let slug of slugList) {
        const res = await request(app)
          .delete(`/api/v1/product/delete/${slug}`)
        
        expect(res.status).toBe(200)
      }

      const res = await request(app)
        .get('/api/v1/product/read')

      expect(res.status).toBe(200)
      expect(res.body.products).toBeInstanceOf(Array)
      expect(res.body.products).toHaveLength(0)
    }, 10000)
 })


  
})
