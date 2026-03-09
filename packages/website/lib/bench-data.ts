import benchData from "@/app/data.json";

const resolverKeys = benchData.resolvers.map((resolver) => resolver.key);
const controlKey = (benchData as { control?: string }).control;

export { benchData, resolverKeys, controlKey };
