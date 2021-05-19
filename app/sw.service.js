const PEOPLE_URL = 'https://swapi.co/api/people/';

export class PeopleService {
    async search(filter) {
        let url = `${PEOPLE_URL}?search=${filter}`;        
        console.log(`URL: ${url}`);

        let rawData = await fetch(url);
        let data = await rawData.json();
        
        return data.results;
    }
}