<?php

namespace common\models;

enum UserRole: int
{
    case ADMIN = 1;
    case USER = 0;
}
