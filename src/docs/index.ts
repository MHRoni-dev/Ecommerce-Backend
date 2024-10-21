import swaggerUI from 'swagger-ui-express';
import path from 'path';
import YAML from 'yamljs';

const swaggerDocument = YAML.load(path.join('src', 'docs', 'swagger.yaml'));
const documentation = [swaggerUI.serve, swaggerUI.setup(swaggerDocument)];

export default documentation;
