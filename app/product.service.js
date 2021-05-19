const PRODUCT_URL = 'products';

export class ProductService {
    async search(filter) {

        let url = `${PRODUCT_URL}?productName_like=${filter}`;        
        console.log(`URL: ${url}`);

        let response = await fetch(url);
        let data = await response.json();
        
        return data;
    }
}