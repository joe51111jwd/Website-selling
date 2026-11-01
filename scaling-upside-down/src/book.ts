import book from "./book.json";

// the hero's hardcover (scripts/make_book_assets.py): two sizes, and where the book itself sits in the
// picture (its shadow on the table runs past it), as fractions [left, top, width, height]
const BASE = import.meta.env.BASE_URL;
const at = (name: string) => `${BASE}book/${name}`;
export const BOOK = {
  src: at(book.files["960"]),
  srcSet: `${at(book.files["480"])} 480w, ${at(book.files["960"])} 960w`,
  w: book.w,
  h: book.h,
  box: book.book as [number, number, number, number],
};
