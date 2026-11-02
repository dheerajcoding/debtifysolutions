// Renders trusted, app-generated SVG/HTML markup (the explainer pictures and icons).
export default function Html({ html, as: Tag = "div", className, ...rest }) {
  if (!html) return null;
  return <Tag className={className} {...rest} dangerouslySetInnerHTML={{ __html: html }} />;
}
