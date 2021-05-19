import { ZeroViewModel } from './ZeroViewModel-0.0.3.js';
import { PeopleService } from './sw.service.js';

const ps = new PeopleService();

window.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content loaded ...');

    let searchVM = new ZeroViewModel({
        el: 'searchView',
        model: {
            filter: ''
        },
        commands: {
            search: async (event) => {
                if (searchVM.model.filter) {
                    console.info(event);
                    console.info(`Searching ${searchVM.model.filter} ...`);

                    new ZeroViewModel({
                        el: 'resultsView',
                        model: {
                            people: await ps.search(searchVM.model.filter)
                        },
                        commands: {            
                        }
                    });                    
                }
                else
                {
                    console.log('No filter data!');
                }
            }
        }
    });
    
    console.log('App is ready!');
});