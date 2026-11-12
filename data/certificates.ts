/**
 * Certificate images, from the "От натурального сырья до международного признания" section of
 * musaffo.uz. To add one, put the file in public/brand/certificates/ and add a line here.
 * Alt text comes from the i18n files and deliberately doesn't name the certificates.
 */
export type Certificate = { src: string; width: number; height: number };

export const certificates: Certificate[] = [
  { src: "/brand/certificates/cert-1.webp", width: 490, height: 618 },
  { src: "/brand/certificates/cert-2.webp", width: 490, height: 618 },
];
