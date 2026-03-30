import { camelCaseToSnakeCase, toSnakeCase, snakeCaseToCamelCase } from './caseConverter';

describe('caseConverter', () => {
    // ==================== camelCaseToSnakeCase ====================

    describe('camelCaseToSnakeCase', () => {
        it('should convert a simple camelCase key', () => {
            expect(camelCaseToSnakeCase('firstName')).toBe('first_name');
        });

        it('should convert multiple uppercase letters', () => {
            expect(camelCaseToSnakeCase('myLongVariableName')).toBe('my_long_variable_name');
        });

        it('should leave an already-lowercase key unchanged', () => {
            expect(camelCaseToSnakeCase('name')).toBe('name');
        });

        it('should handle a single-char key', () => {
            expect(camelCaseToSnakeCase('a')).toBe('a');
        });

        it('should handle an empty string', () => {
            expect(camelCaseToSnakeCase('')).toBe('');
        });

        it('should convert leading uppercase correctly', () => {
            expect(camelCaseToSnakeCase('FirstName')).toBe('_first_name');
        });

        it('should handle consecutive uppercase letters', () => {
            expect(camelCaseToSnakeCase('getHTTPResponse')).toBe('get_h_t_t_p_response');
        });

        it('should handle keys with numbers', () => {
            expect(camelCaseToSnakeCase('item1Name')).toBe('item1_name');
        });
    });

    // ==================== snakeCaseToCamelCase ====================

    describe('snakeCaseToCamelCase', () => {
        it('should convert a simple snake_case key', () => {
            expect(snakeCaseToCamelCase('first_name')).toBe('firstName');
        });

        it('should convert multiple underscored segments', () => {
            expect(snakeCaseToCamelCase('my_long_variable_name')).toBe('myLongVariableName');
        });

        it('should leave an already-camelCase key unchanged', () => {
            expect(snakeCaseToCamelCase('name')).toBe('name');
        });

        it('should handle an empty string', () => {
            expect(snakeCaseToCamelCase('')).toBe('');
        });

        it('should handle trailing underscore with no letter after it', () => {
            // regex _([a-z]) won't match trailing underscore without a letter
            expect(snakeCaseToCamelCase('my_name_')).toBe('myName_');
        });

        it('should handle single character after underscore', () => {
            expect(snakeCaseToCamelCase('a_b')).toBe('aB');
        });

        it('should not modify uppercase letters after underscore', () => {
            // _([a-z]) only matches lowercase after underscore
            expect(snakeCaseToCamelCase('my_Name')).toBe('my_Name');
        });
    });

    // ==================== toSnakeCase ====================

    describe('toSnakeCase', () => {
        it('should convert a flat object keys to snake_case', () => {
            const input = { firstName: 'John', lastName: 'Doe' };
            expect(toSnakeCase(input)).toEqual({ first_name: 'John', last_name: 'Doe' });
        });

        it('should recursively convert nested object keys', () => {
            const input = {
                userInfo: {
                    firstName: 'John',
                    contactDetails: {
                        phoneNumber: '123',
                    },
                },
            };
            const expected = {
                user_info: {
                    first_name: 'John',
                    contact_details: {
                        phone_number: '123',
                    },
                },
            };
            expect(toSnakeCase(input)).toEqual(expected);
        });

        it('should convert arrays of objects', () => {
            const input = [{ firstName: 'John' }, { lastName: 'Doe' }];
            expect(toSnakeCase(input)).toEqual([{ first_name: 'John' }, { last_name: 'Doe' }]);
        });

        it('should handle arrays of primitives', () => {
            expect(toSnakeCase([1, 'hello', true])).toEqual([1, 'hello', true]);
        });

        it('should handle nested arrays', () => {
            const input = { items: [{ itemName: 'A' }, { itemName: 'B' }] };
            expect(toSnakeCase(input)).toEqual({
                items: [{ item_name: 'A' }, { item_name: 'B' }],
            });
        });

        it('should return null as-is', () => {
            expect(toSnakeCase(null)).toBeNull();
        });

        it('should return undefined as-is', () => {
            expect(toSnakeCase(undefined)).toBeUndefined();
        });

        it('should return a string as-is', () => {
            expect(toSnakeCase('hello')).toBe('hello');
        });

        it('should return a number as-is', () => {
            expect(toSnakeCase(42)).toBe(42);
        });

        it('should return a boolean as-is', () => {
            expect(toSnakeCase(true)).toBe(true);
        });

        it('should handle an empty object', () => {
            expect(toSnakeCase({})).toEqual({});
        });

        it('should handle an empty array', () => {
            expect(toSnakeCase([])).toEqual([]);
        });

        it('should preserve values while converting keys', () => {
            const input = { isActive: true, itemCount: 5, userName: null };
            expect(toSnakeCase(input)).toEqual({
                is_active: true,
                item_count: 5,
                user_name: null,
            });
        });
    });
});
