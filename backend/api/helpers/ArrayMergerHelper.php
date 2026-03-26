<?php

namespace api\helpers;

class ArrayMergerHelper
{
    /**
     * Merges multiple permission arrays, deduplicating nested permission lists.
     */
    public static function mergePermissions(array ...$arrays): array
    {
        $result = [];
        foreach ($arrays as $array) {
            foreach ($array as $scope => $entries) {
                if (!isset($result[$scope])) {
                    $result[$scope] = $entries;
                    continue;
                }

                if (is_array($entries) && !array_is_list($entries)) {
                    foreach ($entries as $key => $perms) {
                        $existing = $result[$scope][$key] ?? [];
                        $result[$scope][$key] = array_values(array_unique(array_merge($existing, (array) $perms)));
                    }
                } else {
                    $result[$scope] = array_values(array_unique(array_merge((array) $result[$scope], (array) $entries)));
                }
            }
        }
        return $result;
    }
}
