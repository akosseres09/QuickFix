import { Injectable } from '@angular/core';
import { SpeedDialButton } from '../../constants/speed-dial/SpeedDialButton';

/**
 * Configuration for entity-related speed dial buttons
 */
export interface EntityButtonConfig {
    /** Whether the button should be shown */
    shown: boolean;
    /** Entity name for labels (e.g., 'Project', 'Issue') */
    entityName: string;
}

/**
 * Factory service for creating common SpeedDialButton configurations.
 * Helps reduce boilerplate in list components.
 */
@Injectable({
    providedIn: 'root',
})
export class SpeedDialButtonFactory {
    /**
     * Create a "Create" button
     * @param entityName Name of the entity (e.g., 'Project')
     * @param shown Whether the button should be shown
     * @param route Route segments to navigate to (e.g., ['new'])
     */
    createButton(entityName: string, shown: boolean, route: string | any[]): SpeedDialButton {
        return {
            iconName: 'add',
            label: `Create ${entityName}`,
            shown,
            action: () => (typeof route === 'string' ? [route] : route),
        };
    }

    /**
     * Create an "Edit" button
     * @param entityName Name of the entity (e.g., 'Project')
     * @param shown Whether the button should be shown
     * @param routeBuilder Function that returns the route or null
     */
    editButton(
        entityName: string,
        shown: boolean,
        routeBuilder: () => string | any[] | null
    ): SpeedDialButton {
        return {
            iconName: 'edit',
            label: `Edit ${entityName}`,
            shown,
            action: routeBuilder,
        };
    }

    /**
     * Create a "Delete" button
     * @param entityName Name of the entity (e.g., 'Project')
     * @param shown Whether the button should be shown
     * @param onClick Callback function when clicked
     */
    deleteButton(entityName: string, shown: boolean, onClick: () => void): SpeedDialButton {
        return {
            iconName: 'delete',
            label: `Delete ${entityName}`,
            shown,
            onClick,
        };
    }

    /**
     * Create an "Archive" button
     * @param entityName Name of the entity (e.g., 'Project')
     * @param shown Whether the button should be shown
     * @param onClick Callback function when clicked
     */
    archiveButton(entityName: string, shown: boolean, onClick: () => void): SpeedDialButton {
        return {
            iconName: 'archive',
            label: `Archive ${entityName}`,
            shown,
            onClick,
        };
    }

    /**
     * Create an "Unarchive" button
     * @param entityName Name of the entity (e.g., 'Issue')
     * @param shown Whether the button should be shown
     * @param onClick Callback function when clicked
     */
    unarchiveButton(entityName: string, shown: boolean, onClick: () => void): SpeedDialButton {
        return {
            iconName: 'unarchive',
            label: `Unarchive ${entityName}`,
            shown,
            onClick,
        };
    }

    /**
     * Create a standard set of CRUD buttons for entities with create, edit, delete
     * @param config Configuration for the button set
     */
    createBaseCrudButtons(config: {
        entityName: string;
        hasSelection: boolean;
        createRoute: string | any[];
        editRouteBuilder: () => string | any[] | null;
        onDelete: () => void;
    }): SpeedDialButton[] {
        return [
            this.createButton(config.entityName, !config.hasSelection, config.createRoute),
            this.deleteButton(config.entityName, config.hasSelection, config.onDelete),
            this.editButton(config.entityName, config.hasSelection, config.editRouteBuilder),
        ];
    }

    /**
     * Create a standard set of CRUD buttons for entities with create, edit, delete, archive
     * @param config Configuration for the button set
     */
    createCrudButtons(config: {
        entityName: string;
        hasSelection: boolean;
        createRoute: string | any[];
        editRouteBuilder: () => string | any[] | null;
        onDelete: () => void;
        onArchive: () => void;
    }): SpeedDialButton[] {
        return [
            this.createButton(config.entityName, !config.hasSelection, config.createRoute),
            this.deleteButton(config.entityName, config.hasSelection, config.onDelete),
            this.archiveButton(config.entityName, config.hasSelection, config.onArchive),
            this.editButton(config.entityName, config.hasSelection, config.editRouteBuilder),
        ];
    }

    /**
     * Create buttons for entities with archive/unarchive toggle
     * @param config Configuration for the button set
     */
    createArchivableButtons(config: {
        entityName: string;
        hasSelection: boolean;
        isArchived: boolean;
        createRoute: string | any[];
        editRouteBuilder: () => string | any[] | null;
        onArchive: () => void;
        onUnarchive: () => void;
        onDelete?: () => void;
    }): SpeedDialButton[] {
        const buttons = [
            this.createButton(config.entityName, !config.hasSelection, config.createRoute),
            this.archiveButton(
                config.entityName,
                config.hasSelection && !config.isArchived,
                config.onArchive
            ),
            this.unarchiveButton(
                config.entityName,
                config.hasSelection && config.isArchived,
                config.onUnarchive
            ),
            this.editButton(config.entityName, config.hasSelection, config.editRouteBuilder),
        ];

        if (config.onDelete) {
            buttons.push(
                this.deleteButton(config.entityName, config.hasSelection, config.onDelete)
            );
        }

        return buttons;
    }
}
