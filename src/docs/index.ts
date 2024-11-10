import swaggerUI from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import _merge from 'lodash.merge';

let swaggerDocument;
let productDocs;
let categoryDocs;
let userDocs;
let cartDocs;

try {
  // Load the main OpenAPI YAML
  swaggerDocument = YAML.load(path.join('src', 'docs', 'swagger.yaml'));

  // Load the product-specific YAML
  productDocs = YAML.load(
    path.join('src', 'app', 'v1', 'product', 'docs.yaml'),
  );

  categoryDocs = YAML.load(
    path.join('src', 'app', 'v1', 'category', 'docs.yaml'),
  );

  userDocs = YAML.load(path.join('src', 'app', 'v1', 'user', 'docs.yaml'));

  cartDocs = YAML.load(path.join('src', 'app', 'v1', 'cart', 'docs.yaml'));

  // Merge the product-specific docs into the main OpenAPI document
  _merge(swaggerDocument, userDocs, productDocs, categoryDocs, cartDocs);
} catch (error) {
  console.error('Error loading or merging YAML files:', error);

  // You can initialize an empty object or handle the error as needed
  swaggerDocument = {}; // Initialize to an empty object or provide fallback
}

const documentation = [swaggerUI.serve, swaggerUI.setup(swaggerDocument)];

export default documentation;
