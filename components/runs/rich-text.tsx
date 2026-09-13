import { Fragment, type ReactNode } from "react";

const TOKEN = /(RFC:[A-ZÑ&0-9]{12,13}|EMP:\d{3,5}|CLABE:\d{18}|EX-\d{2,3})/g;

/**
 * Texto con los RFC, `EMP:` y `EX-xx` convertidos en chips interactivos
 * (EXAMPLE §5.3 y §7.4). No interpreta nada más del contenido.
 */
export function RichText({
  text,
  renderEntity,
  renderExhibit,
}: {
  text: string;
  renderEntity: (id: string) => ReactNode;
  renderExhibit?: (exhibitId: string) => ReactNode;
}) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        if (part.startsWith("EX-")) {
          return <Fragment key={index}>{renderExhibit ? renderExhibit(part) : part}</Fragment>;
        }
        return <Fragment key={index}>{renderEntity(part)}</Fragment>;
      })}
    </>
  );
}
