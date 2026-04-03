export class Course {
  constructor(
    public id: number,
    public title: string,
    public description: string,
    public enrolledUsers: number[] = [] // store user IDs
  ) {}
}
