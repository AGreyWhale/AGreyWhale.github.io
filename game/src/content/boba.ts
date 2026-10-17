/** Menu for the Boba Rush mini game. EDIT freely: colors are drawn in the cup. */
export interface BobaOption {
  id: string;
  label: string;
  color: string;
}

export const bobaMenu = {
  bases: [
    { id: 'milk', label: 'Milk tea', color: '#d9b48f' },
    { id: 'green', label: 'Green tea', color: '#c9dc8f' },
    { id: 'oolong', label: 'Oolong', color: '#c98a4e' },
    { id: 'fruit', label: 'Fruit tea', color: '#f4b88a' },
  ],
  flavors: [
    { id: 'brown-sugar', label: 'Brown sugar', color: '#8a5a3c' },
    { id: 'taro', label: 'Taro', color: '#b9a3e3' },
    { id: 'matcha', label: 'Matcha', color: '#87b48b' },
    { id: 'strawberry', label: 'Strawberry', color: '#f49cb0' },
    { id: 'mango', label: 'Mango', color: '#f7c948' },
  ],
  toppings: [
    { id: 'pearls', label: 'Pearls', color: '#3a2b30' },
    { id: 'lychee', label: 'Lychee jelly', color: '#f2f0e6' },
    { id: 'pudding', label: 'Pudding', color: '#f2c14e' },
    { id: 'foam', label: 'Cheese foam', color: '#fff8ee' },
  ],
} satisfies Record<string, BobaOption[]>;

/** Round length and difficulty. */
export const bobaRules = {
  roundSeconds: 90,
  /** Seconds a customer waits at the start / at the end of the round. */
  patienceStart: 26,
  patienceEnd: 14,
  maxToppings: 2,
  strikes: 3,
};


export const bobaCustomers = ['Riya', 'Claire', 'Grant', 'Elizabeth', 'Anand', 'Uswa', 'Zarin', 'Athul', 'Prisha', 'Jenny', 'Sanjana'];
