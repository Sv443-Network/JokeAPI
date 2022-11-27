/*
  Warnings:

  - The primary key for the `Joke` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `lang` on the `Joke` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `lang` on the `Submission` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Joke" DROP CONSTRAINT "Joke_pkey",
DROP COLUMN "lang",
ADD COLUMN     "lang" TEXT NOT NULL,
ADD CONSTRAINT "Joke_pkey" PRIMARY KEY ("id", "lang");

-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "lang",
ADD COLUMN     "lang" TEXT NOT NULL;

-- DropEnum
DROP TYPE "Language";
