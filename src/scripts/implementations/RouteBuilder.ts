import { IRoute } from '../interfaces/IRoute';
import { IRouteDefinitionGroup } from '../interfaces/IRouteDefinitionGroup';

const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

export default class RouteBuilder {
    static getParameterNames(functionHandle: Function) {
        var definition = functionHandle.toString().replace(STRIP_COMMENTS, '');
        return definition.slice(definition.indexOf('(') + 1, definition.indexOf(')')).match(/([^\s,]+)/g) || [];
    }

    static stringToRegex(definition: string): RegExp {
        return new RegExp('^' + definition.replace(/\//g, '\\/').replace(/:(\w*)/g, '([\^S\^\/]*)') + '$');
    }

    static functionToRegex(prefix: string, enter: Function): RegExp {
        var params = RouteBuilder.getParameterNames(enter);
        params.unshift(prefix);
        return RouteBuilder.stringToRegex(params.join('/:'));
    }

    static build(definition: string | RegExp, enter: Function, exit?: (newHash: string) => void, thisArg?: any): IRoute {
        if (typeof definition === 'string') {
            var regex = RouteBuilder.stringToRegex(definition);
            var name = definition;
        } else {
            var regex = definition;
            var name = definition.toString();
        }
        return {
            name: name,
            regex: regex,
            enter: enter,
            exit: exit,
            thisArg: thisArg
        };
    }

    static buildFromFunction(prefix: string, enter: Function, exit?: (newHash: string) => void): IRoute {
        var params = RouteBuilder.getParameterNames(enter);
        params.unshift(prefix);
        var definition = params.join('/:');
        return RouteBuilder.build(definition, enter, exit);
    }

    static buildDefinitionGroup(prefix: string, definitionGroup: IRouteDefinitionGroup, routes?: IRoute[]) {
        routes = routes || [];
        for (var subPrefix in definitionGroup) {
            if (definitionGroup.hasOwnProperty(subPrefix)) {
                var definitions = definitionGroup[subPrefix];
                var fullPrefix = prefix ? prefix + '/' + subPrefix : subPrefix;
                if (definitions instanceof Array) {
                    for (var index = 0, length = definitions.length; index < length; index++) {
                        var definition = definitions[index];
                        if (typeof definition === 'function') {
                            routes.push(RouteBuilder.buildFromFunction(fullPrefix, definition as any));
                        } else {
                            RouteBuilder.buildDefinitionGroup(fullPrefix, definition as any, routes);
                        }
                    }
                } else {
                    routes.push(RouteBuilder.buildFromFunction(fullPrefix, definitions));
                }
            }
        }
        return routes;
    }
}