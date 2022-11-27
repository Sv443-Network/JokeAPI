-- CreateEnum
CREATE TYPE "Category" AS ENUM ('Misc', 'Programming', 'Dark', 'Pun', 'Spooky', 'Christmas');

-- CreateEnum
CREATE TYPE "JokeType" AS ENUM ('single', 'twopart');

-- CreateEnum
CREATE TYPE "Flag" AS ENUM ('nsfw', 'racist', 'religious', 'political', 'sexist', 'explicit');

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('Czech', 'English', 'French', 'German', 'Portuguese', 'Russian', 'Spanish');

-- CreateTable
CREATE TABLE "User" (
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Submission" (
    "userId" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "categories" "Category"[],
    "type" "JokeType" NOT NULL,
    "joke" TEXT NOT NULL,
    "joke2" TEXT,
    "flags" "Flag"[],
    "lang" "Language" NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("userId","submissionId")
);

-- CreateTable
CREATE TABLE "Joke" (
    "categories" "Category"[],
    "type" "JokeType" NOT NULL,
    "joke" TEXT NOT NULL,
    "joke2" TEXT,
    "flags" "Flag"[],
    "lang" "Language" NOT NULL,
    "id" SERIAL NOT NULL,

    CONSTRAINT "Joke_pkey" PRIMARY KEY ("id","lang")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("userId") ON DELETE RESTRICT ON UPDATE CASCADE;
