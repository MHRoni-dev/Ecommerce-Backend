import { IProduct } from '@v1/types';
import request from 'supertest';
import { connectDB, clearDB, disconnectDB } from '@e2e/utils/setup';
import app from '@src/app';
import { newValidProductData, validUpdateProductData } from '@e2e/__fixtures__/productData';
import mongoose from 'mongoose';



beforeAll(async () => {
  await connectDB();
}, 10000);

afterEach( async () => {
  await clearDB()
})

afterAll( async () => {
  await disconnectDB()
})


describe('Product E2E test', () => {
  
  async function createProduct( data : object ) {
    return await request(app)
    .post('/api/v1/product/create')
    .send(data)
  }

  async function updateProduct(slug: string, data: object) {
    return await request(app)
    .put(`/api/v1/product/update/${slug}`)
    .send(data)
  }

  async function readProduct(slug: string) {
    return await request(app)
    .get(`/api/v1/product/read/${slug}`)
  }

  async function deleteProduct(slug: string){
    return await request(app)
    .delete(`/api/v1/product/delete/${slug}`)
  }


  /* test 01
    - /create
    - /read
    - /read/:slug
    - /update/:slug
    - /delete/:slug
  */
  
  it('should create a new product', async () => {
    const res = await createProduct(newValidProductData)

    /*
      - checking if _id, title, price and slug is generated
      - checking if return product is the product that user requested to create
    */
    expect(res.status).toBe(201); 
    expect(res.body.product).toHaveProperty('_id')
    expect(res.body.product).toHaveProperty('title', newValidProductData.title)
    expect(res.body.product).toHaveProperty('price', newValidProductData.price)
    expect(res.body.product).toHaveProperty('slug')

    
  })

  it('should read all createdProduct', async () => {

    const slugList : string[] = []

    //create product
     const productCount = 10
     for (let i = 0; i < productCount; i++) {
       const res = await createProduct({
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
    
     const res = await request(app)
       .get('/api/v1/product/read')

     expect(res.status).toBe(200)
     expect(res.body.products).toBeInstanceOf(Array)
     expect(res.body.products).toHaveLength(0)
   }, 10000)

  it('should read currentProduct with currentSlug', async () => {

    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)
    const createdProduct : IProduct = createRes.body.product

    const res = await readProduct(createdProduct.slug)

    expect(res.status).toBe(200)
    expect(res.body.product).toMatchObject(createdProduct)
  })

  it('should read product with oldSlug', async () => {
    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)

    let currentProduct: IProduct = createRes.body.product
    let productId = currentProduct._id
    let currentSlug = currentProduct.slug
    const slugList = []

    // till here we have only 1 old slug generate some more
    for ( let i = 0; i <= 5; i++ ) {
    
      const res = await updateProduct(currentSlug, {
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

      const res = await readProduct(slug)

      expect(res.status).toBe(200)
      expect(res.body.product).toHaveProperty('_id', productId)
      expect(res.body.product).toHaveProperty('slug', currentSlug)
      expect(res.body.product).toHaveProperty('title', currentProduct.title)
      expect(res.body.product).toHaveProperty('price', currentProduct.price)
    }
  }, 10000)

  it('should update product', async () => {
    //create product
    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)

    const createdProduct : IProduct = createRes.body.product

    //update product
    const res = await updateProduct(createdProduct.slug, validUpdateProductData)

    /*
      - checking if return product is the same that was requested
      - checking if title and price is updated
      - checking if slug was auto updated
    */
    expect(res.status).toBe(200)
    expect(res.body.product).toHaveProperty('_id', createdProduct._id)
    expect(res.body.product).toHaveProperty('title', validUpdateProductData.title)
    expect(res.body.product).toHaveProperty('slug', expect.not.stringMatching(createdProduct.slug))
    expect(res.body.product).toHaveProperty('price', validUpdateProductData.price)

  })

  it('should not let update with the oldSlug', async () => {
    const slugList = []
    let currentSlug = ''

    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)
    currentSlug = createRes.body.product.slug

    for(let i = 0 ; i < 5; i++) {
      const updateRes = await updateProduct(currentSlug, {title : `update no ${i + 1}`})
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.product).toHaveProperty('slug', expect.not.stringMatching(currentSlug))
      slugList.push(currentSlug)
      currentSlug = updateRes.body.product.slug
    }

    // update test
    
    for (let slug of slugList) {
      
      const res = await updateProduct(slug, {price : 200})
      expect(res.status).toBe(404)

    }

    
  },10000)

  it('should delete product with currentSlug', async () => {
    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)

    const product: IProduct = createRes.body.product
    //delete phase
    
      const res = await deleteProduct(product.slug)
        
      expect(res.status).toBe(200)
      expect(res.body.product).toHaveProperty('_id', product._id)
      expect(res.body.product).toHaveProperty('slug', product.slug)
      expect(res.body.product).toHaveProperty('title', product.title)
    
    //check if delete was successfull
    
    const readRes = await readProduct(product.slug)
    expect(readRes.status).toBe(404)
    

  })

  it('should not delete with oldSlug', async () => {

    const slugList = []
    let currentSlug = ''

    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)
    currentSlug = createRes.body.product.slug

    for(let i = 0 ; i < 5; i++) {
      const updateRes = await updateProduct(currentSlug, {title : `update no ${i + 1}`})
      expect(updateRes.status).toBe(200)
      expect(updateRes.body.product).toHaveProperty('slug', expect.not.stringMatching(currentSlug))
      slugList.push(currentSlug)
      currentSlug = updateRes.body.product.slug
    }

    
    for (let slug of slugList) {
      const res = await request(app)
        .delete(`/api/v1/product/delete/${slug}`)

      expect(res.status).toBe(404)
    }

  },10000)

  it('should not found any ProductRedirect of the deleted product', async () => {
    const createRes = await createProduct(newValidProductData)
    expect(createRes.status).toBe(201)

    const updateRes = await updateProduct(createRes.body.product.slug, validUpdateProductData)
    expect(updateRes.status).toBe(200)
    
    const deleteRes = await deleteProduct(updateRes.body.product.slug)
    expect(deleteRes.status).toBe(200)
    
    const res = await mongoose.model('productRedirect').findOne({productId : deleteRes.body.product._id})
    expect(res).toBe(null)
  } )


})
