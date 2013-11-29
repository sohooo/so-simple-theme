require 'favicon_maker'

desc 'generate favicons based on avatar.png'
task :icons do
  options = {
    :root_dir => File.expand_path('../..', __FILE__),
    :base_image => "avatar.png",
    :input_dir => "images",
    :output_dir => "images"
  }
  FaviconMaker::Generator.create_versions(options) do |filepath|
    puts "Created favicon: #{filepath}"
  end
end
