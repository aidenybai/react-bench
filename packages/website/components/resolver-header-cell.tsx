import { benchData, getToolGithubUrl, getToolLogoUrl } from "@/lib/bench-data";

interface ResolverHeaderCellProps {
  resolverKey: string;
}

const ResolverHeaderCell = ({ resolverKey }: ResolverHeaderCellProps) => {
  const resolver = benchData.resolvers.find(
    (innerResolver) => innerResolver.key === resolverKey,
  );
  const githubUrl = getToolGithubUrl(resolverKey);
  const logoUrl = getToolLogoUrl(resolverKey);

  return (
    <a
      href={githubUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-end gap-1.5 hover:underline"
    >
      {logoUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={logoUrl} alt="" className="size-4 shrink-0 rounded-full" />
      )}
      {resolver?.label ?? resolverKey}
    </a>
  );
};

export { ResolverHeaderCell };
