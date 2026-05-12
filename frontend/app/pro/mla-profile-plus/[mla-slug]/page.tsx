import TrackerMlaPage, {
  generateMetadata,
  generateStaticParams,
} from "../../../tracker/mla/[mla-slug]/page";
import { getMlaById } from "../../../tracker/_data";
import { ProPageTitleSetter } from "../ProPageTitleSetter";

export { generateMetadata, generateStaticParams };

export default async function ProMlaProfilePlusDetailPage({
  params,
}: {
  params: Promise<{ "mla-slug": string }>;
}) {
  const resolvedParams = await params;
  const mla = getMlaById(resolvedParams["mla-slug"]);

  return (
    <div className="pro-mla-profile-plus-detail">
      <ProPageTitleSetter
        title={mla?.name ?? "MLA Profile +"}
        breadcrumb={["MLA Profile +", mla?.name ?? "Profile"]}
      />
      <TrackerMlaPage params={Promise.resolve(resolvedParams)} />
    </div>
  );
}
