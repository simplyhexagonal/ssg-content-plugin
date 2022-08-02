declare const ssgContentPlugin: () => Promise<{
    name: string;
    enforce: "pre";
    transform(code: string, id: string): {
        code: string;
        map: null;
    };
}>;
export default ssgContentPlugin;
