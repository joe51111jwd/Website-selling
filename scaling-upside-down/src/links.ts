// Outbound links. Fill these in when Michael has them; the site adapts.
// preorder: the store page (e.g. Amazon or Bookshop). Empty means pre-orders are not open yet.
export const LINKS = {
  preorder: "",
};

export const preorderHref = () => LINKS.preorder || "#book";
