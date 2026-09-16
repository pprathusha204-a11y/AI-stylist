import type {
  CustomerRequirements,
} from "./session.service";

export type BodyTypeOption = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  selectValue: string;
};

export type BodyTypeGroup = {
  title: string;
  options: BodyTypeOption[];
};

function getImageDetails(
  requirements: CustomerRequirements,
) {
  const audienceText =
    `${requirements.department ?? ""} ${
      requirements.gender ?? ""
    }`.toLowerCase();

  const isWomen =
    audienceText.includes("women") ||
    audienceText.includes("woman") ||
    audienceText.includes("female") ||
    audienceText.includes("ladies");

  return {
    imagePrefix: isWomen
      ? "Women"
      : "Men",

    imageBaseUrl:
      "https://tech-tailor.com/assets/images/shop",
  };
}

export function getBodyTypeGroup(
  requirements: CustomerRequirements,
): BodyTypeGroup {
  const {
    imagePrefix,
    imageBaseUrl,
  } = getImageDetails(requirements);

  return {
    title: "Choose Your Body Build",

    options: [
      {
        id: "ectomorph",
        name: "Slim Build",
        description:
          "Lean body with narrower shoulders and waist.",

        imageUrl:
          `${imageBaseUrl}/${imagePrefix}_Ectomorph.png`,

        selectValue:
          "My body type is Ectomorph, shown as Slim Build",
      },

      {
        id: "mesomorph",
        name: "Athletic Build",
        description:
          "Balanced body with naturally broader shoulders.",

        imageUrl:
          `${imageBaseUrl}/${imagePrefix}_Mesomorph.png`,

        selectValue:
          "My body type is Mesomorph, shown as Athletic Build",
      },

      {
        id: "endomorph",
        name: "Broad Build",
        description:
          "Fuller body with a broader chest and waist.",

        imageUrl:
          `${imageBaseUrl}/${imagePrefix}_Endomorph.png`,

        selectValue:
          "My body type is Endomorph, shown as Broad Build",
      },
    ],
  };
}

export function getFitOptionsGroup(
  requirements: CustomerRequirements,
): BodyTypeGroup {
  const {
    imagePrefix,
    imageBaseUrl,
  } = getImageDetails(requirements);

  return {
    title: "Choose Your Fit",

    options: [
      {
        id: "slim-fit",
        name: "Slim Fit",
        description:
          "A closer fit around the body.",

        imageUrl:
          `${imageBaseUrl}/${imagePrefix}_Ectomorph.png`,

        selectValue:
          "I prefer Slim Fit and my body type is Ectomorph",
      },

      {
        id: "regular-fit",
        name: "Regular Fit",
        description:
          "A comfortable and balanced fit.",

        imageUrl:
          `${imageBaseUrl}/${imagePrefix}_Mesomorph.png`,

        selectValue:
          "I prefer Regular Fit and my body type is Mesomorph",
      },

      {
        id: "relaxed-fit",
        name: "Relaxed Fit",
        description:
          "A comfortable fit.",

        imageUrl:
          `${imageBaseUrl}/${imagePrefix}_Endomorph.png`,

        selectValue:
          "I prefer Relaxed Fit and my body type is Endomorph",
      },
    ],
  };
}