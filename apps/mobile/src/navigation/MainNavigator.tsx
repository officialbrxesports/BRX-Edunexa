import React from "react";

import HeadStack from "./stacks/HeadStack";
import TeacherStack from "./stacks/TeacherStack";
import StudentStack from "./stacks/StudentStack";
import StaffStack from "./stacks/StaffStack";

import { ROLES, type UserRole } from "../constants/roles";

type Props = {
  role: UserRole;
};

export default function MainNavigator({ role }: Props) {
  switch (role) {
    case ROLES.HEAD:
      return <HeadStack />;

    case ROLES.TEACHER:
      return <TeacherStack />;

    case ROLES.STUDENT:
      return <StudentStack />;

    case ROLES.STAFF:
      return <StaffStack />;

    default:
      return <HeadStack />;
  }
}
