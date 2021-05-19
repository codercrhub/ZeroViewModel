// ZeroViewModel
// Version 20171010
// Gilberto Bermúdez
// gbermude@outlook.com
// Busca hacer un acercamiento a un Model View ViewModel framework utilizando los recursos disponibles por medio de ES6.
// TODO
// - Enlace de dos vías en colecciones
// - Revisar la repetición del código de enlaza template strings
// - Commnand, Can Exceute para Validaciones
// - Implementar con condición if agregar atributos a la etiqueta.eJ.: if-propiedadBOOL="style=color:red;", if-ready="class='listo'"
export class ZeroViewModel {
    constructor(settings) {
        const qryEmpty = 'span:not(:empty), p:not(:empty), th:not(:empty), td:not(:empty), legend:not(:empty), a:not(:empty), button:not(:empty), dd:not(:empty), strong:not(:empty)';

        this.el = settings.el;
        this.model = settings.model;
        this.commands = settings.commands;

        this.root = document.querySelector(`#${this.el} template`);
        if (!this.root) {
            console.error(`ViewModel: No se encuentra el elemento: #${this.el} template`);
        }

        if (this.root) {
            let mainTemplateParent = this.root.parentElement;
            let mainContent = this.root.content.cloneNode(true);

            // Limpiar el contenido actual
            let children = mainTemplateParent.querySelectorAll('*:not(template)');
            children.forEach((el) => { el.remove(); });    

            // Procesar valores a repetir
            let repeats = mainContent.querySelectorAll('[repeat]');
            repeats.forEach((repeat) => {
                let set = repeat.getAttribute('repeat');
                repeat.removeAttribute('repeat');

                // Determinar si existe la propiedad de datos, solo en contenido de texto
                if (this.model[set]) {
                    let parent = repeat.parentElement;

                    // Iterar por la propiedad de datos
                    for (let row of this.model[set]) {

                        // Una vez creado el clone los cambios se efectúan sobre este
                        let clone = document.importNode(repeat, true);

                        // Se evalúa una posible template string en el contenido de texto
                        let elements = clone.querySelectorAll(qryEmpty);
                        elements.forEach((el) => {
                            if (el.textContent && !/<.+>.*<\/.+>/.test(el.innerHTML)) {
                                el.textContent = this.executeTemplate(el.textContent, row);
                            }
                        });

                        // Se evalúa una posible template string en atributos específicos a soportar
                        ['click', 'href', 'src'].forEach(attr => {
                            elements = clone.querySelectorAll(`[${attr}]`);
                            elements.forEach((el) => {
                                let attrValue = el.getAttribute(attr);
                                if (attrValue) {
                                    el.setAttribute(attr, this.executeTemplate(attrValue, row));
                                }
                            });
                        });

                        // Se agrega al documento
                        parent.appendChild(clone);
                    }

                    // Nueva atributo interno para el valor, más
                    // adelante se genera una propiedad
                    this.model['_' + set] = this.model[set];

                    // TODO Crear propiedad para mantener el enlace en dos vías
                    Object.defineProperty(this.model, set, {
                        get: () => { return this.model['_' + set]; },
                        set: (newValue) => {
                            this.model['_' + set] = newValue;

                            // Eliminar la repetición generada
                            //let repeticion = document.querySelectorAll(`[repeat=${set}]`);
                            //console.log(repeticion);
                            //repeticion.forEach((el) => { el.remove(); });

                            // TODO Volver a generar la repetición
                        }
                    });
                }
                // Se elimina el elemento utilizado como base del repeat
                repeat.remove();
            });

            // Enlazar a inputs
            let inputs = mainContent.querySelectorAll('input[name]');
            inputs.forEach((input) => {
                // Asignar el valor inicial
                let value = this.model[input.name];
                if (value) {
                    input.value = value;

                    // Nueva atributo interno para el valor, más
                    // adelante se genera una propiedad
                    this.model['_' + input.name] = value;
                }
            });

            // Se evalúa una posible template string en el contenido de texto
            let elements = mainContent.querySelectorAll(qryEmpty);
            elements.forEach((el) => {
                if (el.textContent && !/<.+>.*<\/.+>/.test(el.innerHTML)) {
                    el.textContent = this.executeTemplate(el.textContent, this.model);
                }
            });

            // Se evalúa una posible template string en atributos específicos a soportar
            ['click', 'href', 'src'].forEach(attr => {
                elements = mainContent.querySelectorAll(`[${attr}]`);
                elements.forEach((el) => {
                    let attrValue = el.getAttribute(attr);
                    if (attrValue) {
                        el.setAttribute(attr, this.executeTemplate(attrValue, this.model));
                    }
                });
            });

            // Incorporar el contenido de plantilla/vista al documento
            mainTemplateParent.appendChild(document.importNode(mainContent, true));

            // Una vez incorporado el nuevo contenido se agrega el soporte
            // de eventos esto pues los eventos se soportan hasta que el contenido esté
            // en el documento

            // Enlazar eventos a comandos
            ['click', 'keyup'].forEach((eventName) => {
                let eventTargets = mainTemplateParent.querySelectorAll(`[${eventName}]`);
                eventTargets.forEach((eventTarget) => {
                    // Suscribir al cambio
                    eventTarget.addEventListener(eventName, async (event) => {
                        event.preventDefault();
                        let signature = event.target.getAttribute(eventName);

                        // Determinar si se asignaron parámetros
                        let signatureParts = /([a-zA-Z0-9_]+)\((.+)\)/.exec(signature);
                        let name = signatureParts ? signatureParts[1] : signature;
                        let params = signatureParts ? signatureParts[2].split(',') : null;

                        let command = this.commands[name];
						const isAsync = command.constructor.name === "AsyncFunction";
						console.log(`${command.name} isAsync: ${isAsync}`);
                        if (command) {
                            if (params) {
                                isAsync ? await command(event, ...params) : command(event, ...params);
                            }
                            else {
                                isAsync ? await command(event) : command(event);
                            }
                        }
                    });
                });
            });

            // Enlazar a inputs
            inputs = mainTemplateParent.querySelectorAll('input[name]');
            inputs.forEach((input) => {
                // Suscribir al cambio
                input.addEventListener('input', (event) => {
                    this.model[event.target.name] = event.target.value;
                });

                // Crear propiedad para mantener el enlace en dos vías
                Object.defineProperty(this.model, input.name, {
                    get: () => { return this.model['_' + input.name]; },
                    set: (newValue) => {
                        input.value = newValue;
                        this.model['_' + input.name] = newValue;
                    }
                });
            });

            // Si existe se llama al init
            if (this.commands.init) {
                this.commands.init();
            }
        }
    }

    toString() {
        return `${this.el}`;
    }

    // Permite crear la función para procesar una plantilla
    buildTemplate(literal, ...params) {
        return new Function(...params, "return `" + literal + "`;");
    }

    // Permite la aplicación de una plantilla sobre un modelo
    executeTemplate(content, model) {
        let result = content;

        // Se determina si hay definición de un template string
        // Por el momento solamente elementos que no contengan a su vez HTML
        // deben ser solo de texto
        if (content && !/<.+>.*<\/.+>/.test(content) && /\${.+}/.test(content)) {

            // Si es un objeto se obtienen sus partes
            if (typeof model === 'object') {
                let template = this.buildTemplate(content, Object.keys(model));
                result = template(...Object.values(model));
            }
            else {
                let template = this.buildTemplate(content);
                result = template();
            }
        }

        return result;
    }
}
