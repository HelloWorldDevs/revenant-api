CKEDITOR.plugins.add( 'rev-image-upload', {
    requires: 'widget',

    icons: 'rev-image',

    init: function( editor ) {
        console.log('rev-upload!!!!', editor)

        editor.addCommand( 'abbr', new CKEDITOR.dialogCommand( 'abbrDialog' ) );

        editor.ui.addButton('rev-image', {
            label: 'Upload Image',
            command: 'abbr',
            toolbar: 'insert,100'
        });
    }
} );