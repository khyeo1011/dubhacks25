import Resolver from '@forge/resolver';

const resolver = new Resolver();

resolver.define('getText', (req) => {
  console.log(req);
  return 'Different response';
});

resolver.define('sendData', (req) => {
  console.log('Data received:', req);
  return `Data received successfully "${req.payload.query}" testing links : <Link href = "https://www.example.com">Link Example<Link/>`;
});

export const handler = resolver.getDefinitions();
